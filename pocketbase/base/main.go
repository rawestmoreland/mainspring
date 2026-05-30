package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"slices"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"

	"github.com/NdoleStudio/lemonsqueezy-go"

	_ "mainspring/migrations"

	"mainspring/analytics"
)

func init() {
	// Load .env in local dev; in production (Fly.io) secrets are already env vars
	_ = godotenv.Load()
}

const (
	freeProjectLimit = 2
	freePhotoLimit   = 3
)

var (
	subdomainRe = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$`)

	reservedSubdomains = []string{
		"www", "app", "api", "admin", "mail", "smtp", "imap", "pop",
		"support", "help", "docs", "status", "blog", "dashboard",
		"login", "logout", "signup", "register", "auth", "account",
		"settings", "billing", "pricing", "about", "contact",
		"static", "assets", "cdn", "media", "images", "uploads",
		"dev", "staging", "preview", "test", "demo", "sandbox",
		"hairspring", "mainspring",
	}
)

// hasPaidSubscription mirrors hasPaidSubscription() in src/lib/helpers.ts.
func hasPaidSubscription(sub *core.Record) bool {
	status := sub.GetString("subscription_status")
	now := time.Now()

	switch status {
	case "active", "on_trial", "paid", "cancelled":
		endsAt := sub.GetDateTime("ends_at")
		return endsAt.IsZero() || endsAt.Time().After(now)
	case "past_due":
		renewsAt := sub.GetDateTime("renews_at")
		if renewsAt.IsZero() {
			return false
		}
		return now.Before(renewsAt.Time().Add(48 * time.Hour))
	default:
		return false
	}
}

// hasPro mirrors hasPro() in src/lib/helpers.ts.
func hasPro(sub *core.Record) bool {
	return hasPaidSubscription(sub)
}

// createFreeSubscription inserts a blank subscription row for a new user.
// The record ID is set to the user's ID so the webhook handler can locate it
// with FindRecordById("subscriptions", userID).
func createFreeSubscription(userID string, app core.App) error {
	col, err := app.FindCollectionByNameOrId("subscriptions")
	if err != nil {
		return fmt.Errorf("failed to find subscriptions collection: %w", err)
	}
	sub := core.NewRecord(col)
	sub.Set("user", userID)
	sub.Set("subscription_status", "free")
	if err := app.Save(sub); err != nil {
		return fmt.Errorf("failed to create subscription record: %w", err)
	}
	return nil
}

// freezeExcessProjects keeps the 2 most-recently-updated non-sold watches
// unfrozen and freezes the rest. Called after a subscription lapses.
func freezeExcessProjects(userID string, app core.App) {
	watches, err := app.FindRecordsByFilter(
		"watches",
		"user = {:userId} && status != 'sold'",
		"-updated",
		-1, 0,
		dbx.Params{"userId": userID},
	)
	if err != nil {
		return
	}
	for i, w := range watches {
		shouldFreeze := i >= freeProjectLimit
		if w.GetBool("is_frozen") != shouldFreeze {
			w.Set("is_frozen", shouldFreeze)
			app.Save(w)
		}
	}
}

// unfreezeAllProjects clears is_frozen on every watch for the user.
// Called when a subscription is reinstated.
func unfreezeAllProjects(userID string, app core.App) {
	watches, err := app.FindRecordsByFilter(
		"watches",
		"user = {:userId} && is_frozen = true",
		"", -1, 0,
		dbx.Params{"userId": userID},
	)
	if err != nil {
		return
	}
	for _, w := range watches {
		w.Set("is_frozen", false)
		app.Save(w)
	}
}

func main() {
	app := pocketbase.New()

	LS_API_KEY := os.Getenv("LEMONSQUEEZY_API_KEY")

	squeezyClient := lemonsqueezy.New(lemonsqueezy.WithAPIKey(LS_API_KEY))

	products, response, err := squeezyClient.Products.List(context.Background())

	if err == nil {
		fmt.Println(products)
		fmt.Println(response.HTTPResponse)
	} else {
		fmt.Println(err)
	}

	// loosely check if it was executed using "go run"
	// go run compiles to a temp directory, check multiple possible patterns
	execPath := os.Args[0]
	isGoRun := strings.HasPrefix(execPath, os.TempDir()) ||
		strings.Contains(execPath, "go-build") ||
		strings.Contains(execPath, "/tmp/") ||
		strings.Contains(execPath, "/var/folders/")

	log.Println("isGoRun", isGoRun, "execPath:", execPath)

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		Automigrate: isGoRun,
	})

	app.OnRecordAuthWithOAuth2Request().BindFunc(func(e *core.RecordAuthWithOAuth2RequestEvent) error {
		isNew := e.IsNewRecord

		var displayName string
		if e.OAuth2User.Name != "" {
			displayName = e.OAuth2User.Name
		} else if e.OAuth2User.Username != "" {
			displayName = e.OAuth2User.Username
		} else if e.OAuth2User.Email != "" {
			displayName = strings.SplitN(e.OAuth2User.Email, "@", 2)[0]
		}

		if err := e.Next(); err != nil {
			return err
		}

		// Create user_profile for new OAuth2 sign-ups.
		// We do this here rather than in OnRecordCreateRequest because display_name
		// is not a field on the users collection and won't appear on e.Record there.
		if isNew && e.Record != nil {
			_, err := app.FindFirstRecordByFilter("user_profiles", "user = {:user}", dbx.Params{"user": e.Record.Id})
			if err != nil {
				if !errors.Is(err, sql.ErrNoRows) {
					return fmt.Errorf("profile lookup failed: %w", err)
				}
				col, err := app.FindCollectionByNameOrId("user_profiles")
				if err != nil {
					return fmt.Errorf("failed to find user_profiles collection: %w", err)
				}
				profile := core.NewRecord(col)
				profile.Set("user", e.Record.Id)
				profile.Set("email", e.Record.Email())
				profile.Set("display_name", displayName)
				if err := app.Save(profile); err != nil {
					return fmt.Errorf("failed to create user profile: %w", err)
				}
				if err := createFreeSubscription(e.Record.Id, app); err != nil {
					return err
				}
			}
		}

		return nil
	})

	app.OnRecordCreateRequest("users").BindFunc(func(e *core.RecordRequestEvent) error {
		info, err := e.RequestInfo()
		if err != nil {
			return err
		}

		// OAuth2 user creation is handled by OnRecordAuthWithOAuth2Request.
		if info.Context == core.RequestInfoContextOAuth2 {
			return e.Next()
		}

		if e.Record.GetString("email") == "" {
			return e.String(http.StatusBadRequest, "email is required")
		}
		if e.Record.GetString("password") == "" {
			return e.String(http.StatusBadRequest, "password is required")
		}

		// Capture display_name from raw request data before Next() discards it.
		displayName, _ := info.Body["display_name"].(string)

		if err := e.Next(); err != nil {
			return err
		}

		// User is now persisted — safe to create the profile.
		email := e.Record.GetString("email")

		_, err = app.FindFirstRecordByFilter("user_profiles", "user = {:user}", dbx.Params{"user": e.Record.Id})
		if err != nil {
			if !errors.Is(err, sql.ErrNoRows) {
				return fmt.Errorf("profile lookup failed: %w", err)
			}
			col, err := app.FindCollectionByNameOrId("user_profiles")
			if err != nil {
				return fmt.Errorf("failed to find user_profiles collection: %w", err)
			}
			profile := core.NewRecord(col)
			profile.Set("user", e.Record.Id)
			profile.Set("email", email)
			profile.Set("display_name", displayName)
			if err := app.Save(profile); err != nil {
				return fmt.Errorf("failed to create user profile: %w", err)
			}
			if err := createFreeSubscription(e.Record.Id, app); err != nil {
				return err
			}
		}

		return nil
	})

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// serves static files from the provided public dir (if exists)
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))

		return se.Next()
	})

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.POST("/api/lemonsqueezy/webhook", func(e *core.RequestEvent) error {
			secret := os.Getenv("LEMONSQUEEZY_WEBHOOK_SECRET")

			body, err := io.ReadAll(e.Request.Body)
			if err != nil {
				return e.String(http.StatusBadRequest, "failed to read body")
			}

			// Verify HMAC-SHA256 signature
			sig := e.Request.Header.Get("X-Signature")
			mac := hmac.New(sha256.New, []byte(secret))
			mac.Write(body)
			expected := hex.EncodeToString(mac.Sum(nil))
			if !hmac.Equal([]byte(sig), []byte(expected)) {
				return e.String(http.StatusUnauthorized, "invalid signature")
			}

			var payload struct {
				Meta struct {
					EventName  string `json:"event_name"`
					CustomData struct {
						UserID   string `json:"user_id"`
						ClientID string `json:"ga_client_id"`
					} `json:"custom_data"`
				} `json:"meta"`
				Data struct {
					ID         string `json:"id"`
					Attributes struct {
						CustomerID     int    `json:"customer_id"`
						RenewsAt       string `json:"renews_at"`
						EndsAt         string `json:"ends_at"`
						Status         string `json:"status"`
						TotalUSD       int    `json:"total_usd"`
						Currency       string `json:"currency"`
						TaxUSD         int    `json:"tax_usd"`
						FirstOrderItem struct {
							ID        string `json:"id"`
							ProductID string `json:"product_id"`
							VariantID string `json:"variant_id"`
							Price     int    `json:"price"`
						}
					} `json:"attributes"`
				} `json:"data"`
			}
			if err := json.Unmarshal(body, &payload); err != nil {
				return e.String(http.StatusBadRequest, "invalid json")
			}

			eventName := payload.Meta.EventName
			userID := payload.Meta.CustomData.UserID
			clientID := payload.Meta.CustomData.ClientID

			if (eventName == "order_created" || eventName == "subscription_created" || eventName == "subscription_payment_success") && userID != "" {
				record, err := app.FindFirstRecordByData("subscriptions", "user", userID)
				if err == nil {
					record.Set("subscription_status", "active")
					record.Set("ends_at", payload.Data.Attributes.EndsAt)
					if payload.Data.ID != "" {
						record.Set("subscription_id", payload.Data.ID)
					}
					if payload.Data.Attributes.CustomerID != 0 {
						record.Set("lemon_squeezy_customer_id", fmt.Sprintf("%d", payload.Data.Attributes.CustomerID))
					}
					if payload.Data.Attributes.RenewsAt != "" {
						record.Set("renews_at", payload.Data.Attributes.RenewsAt)
					}
					app.Save(record)
					if clientID != "" && clientID != "unknown" {
						tracker := analytics.NewTracker(os.Getenv("GA4_API_URL"), clientID)
						tracker.TrackEvent(context.Background(), "purchase", map[string]any{
							"user_id": userID,
							"event":   eventName,
							"ecommerce": map[string]any{
								"transaction_id": payload.Data.ID,
								"value":          float64(payload.Data.Attributes.TotalUSD) * 0.01,
								"tax":            float64(payload.Data.Attributes.TaxUSD) * 0.01,
								"currency":       payload.Data.Attributes.Currency,
								"items": []map[string]any{
									{
										"item_id":      payload.Data.Attributes.FirstOrderItem.ProductID,
										"item_variant": payload.Data.Attributes.FirstOrderItem.VariantID,
										"price":        float64(payload.Data.Attributes.FirstOrderItem.Price) * 0.01,
										"quantity":     1,
									},
								},
							},
						})
					}
					unfreezeAllProjects(userID, app)
				} else {
					fmt.Printf("Subscription record not found for user %s\n", userID)
					// Create the subscription record if it doesn't exist
					col, err := app.FindCollectionByNameOrId("subscriptions")
					if err != nil {
						return fmt.Errorf("failed to find subscriptions collection: %w", err)
					}
					subscription := core.NewRecord(col)
					subscription.Set("user", userID)
					subscription.Set("subscription_status", "active")
					subscription.Set("ends_at", payload.Data.Attributes.EndsAt)
					if payload.Data.ID != "" {
						subscription.Set("subscription_id", payload.Data.ID)
					}
					if payload.Data.Attributes.CustomerID != 0 {
						subscription.Set("lemon_squeezy_customer_id", fmt.Sprintf("%d", payload.Data.Attributes.CustomerID))
					}
					if payload.Data.Attributes.RenewsAt != "" {
						subscription.Set("renews_at", payload.Data.Attributes.RenewsAt)
					}
					if err := app.Save(subscription); err != nil {
						return fmt.Errorf("failed to create subscription record: %w", err)
					}
					if clientID != "" && clientID != "unknown" {
						tracker := analytics.NewTracker(os.Getenv("GA4_API_URL"), clientID)
						tracker.TrackEvent(context.Background(), "purchase", map[string]any{
							"user_id": userID,
							"event":   eventName,
						})
					}
					unfreezeAllProjects(userID, app)
				}
			}

			if eventName == "subscription_expired" && userID != "" {
				record, err := app.FindFirstRecordByData("subscriptions", "user", userID)
				if err == nil {
					record.Set("subscription_status", "expired")
					record.Set("renews_at", "")
					app.Save(record)
					freezeExcessProjects(userID, app)
				}
			}

			if (eventName == "subscription_updated" || eventName == "subscription_resumed") && userID != "" {
				record, err := app.FindFirstRecordByData("subscriptions", "user", userID)
				if err == nil {
					status := payload.Data.Attributes.Status
					record.Set("subscription_status", status)
					record.Set("renews_at", payload.Data.Attributes.RenewsAt)
					app.Save(record)
					if hasPaidSubscription(record) {
						unfreezeAllProjects(userID, app)
					} else {
						freezeExcessProjects(userID, app)
					}
				}
			}

			if eventName == "subscription_cancelled" && userID != "" {
				record, err := app.FindFirstRecordByData("subscriptions", "user", userID)
				if err == nil {
					record.Set("subscription_status", payload.Data.Attributes.Status)
					record.Set("renews_at", "")
					record.Set("ends_at", payload.Data.Attributes.EndsAt)
					app.Save(record)
					if clientID != "" && clientID != "unknown" {
						tracker := analytics.NewTracker(os.Getenv("GA4_API_URL"), clientID)
						tracker.TrackEvent(context.Background(), "subscription_cancelled", map[string]any{
							"user_id": userID,
							"event":   eventName,
						})
					}
					// If ends_at is still in the future the user retains access until then;
					// freeze only once the subscription is no longer active.
					if hasPaidSubscription(record) {
						unfreezeAllProjects(userID, app)
					} else {
						freezeExcessProjects(userID, app)
					}
				}
			}

			return e.String(http.StatusOK, "ok")
		})
		return se.Next()
	})

	validateSubdomain := func(sub string, e *core.RecordEvent) error {
		if sub == "" {
			return nil
		}
		_, err := e.App.FindFirstRecordByData("user_profiles", "subdomain", sub)
		if err == nil {
			return apis.NewApiError(http.StatusBadRequest, "subdomain already in use", nil)
		}
		if !subdomainRe.MatchString(sub) {
			return apis.NewApiError(http.StatusBadRequest, "subdomain must match ^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$", nil)
		}
		if slices.Contains(reservedSubdomains, sub) {
			return apis.NewApiError(http.StatusBadRequest, "subdomain is reserved", nil)
		}
		return nil
	}

	app.OnRecordCreate("user_profiles").BindFunc(func(e *core.RecordEvent) error {
		if err := validateSubdomain(e.Record.GetString("subdomain"), e); err != nil {
			return err
		}
		return e.Next()
	})

	app.OnRecordUpdate("user_profiles").BindFunc(func(e *core.RecordEvent) error {
		if err := validateSubdomain(e.Record.GetString("subdomain"), e); err != nil {
			return err
		}
		return e.Next()
	})

	// Enforce free-tier project limit before a new watch is persisted.
	app.OnRecordCreate("watches").BindFunc(func(e *core.RecordEvent) error {
		userID := e.Record.GetString("user")
		if userID == "" {
			return e.Next()
		}

		subscription, err := e.App.FindFirstRecordByData("subscriptions", "user", userID)
		if err != nil {
			return apis.NewApiError(http.StatusForbidden, "subscription not found", nil)
		}

		if hasPro(subscription) {
			return e.Next()
		}

		// Count active (non-sold) projects for this user.
		active, err := e.App.FindRecordsByFilter(
			"watches",
			"user = {:userId} && status != 'sold'",
			"-created",
			freeProjectLimit+1,
			0,
			dbx.Params{"userId": userID},
		)
		if err != nil {
			return fmt.Errorf("project count query failed: %w", err)
		}
		if len(active) >= freeProjectLimit {
			return apis.NewApiError(
				http.StatusForbidden,
				fmt.Sprintf("free accounts are limited to %d active projects", freeProjectLimit),
				nil,
			)
		}

		return e.Next()
	})

	// Enforce free-tier photo limit before a new photo is persisted.
	app.OnRecordCreate("watch_photos").BindFunc(func(e *core.RecordEvent) error {
		watchID := e.Record.GetString("watch")

		watch, err := e.App.FindRecordById("watches", watchID)
		if err != nil {
			return apis.NewApiError(http.StatusBadRequest, "watch not found", nil)
		}

		subscription, err := e.App.FindFirstRecordByData("subscriptions", "user", watch.GetString("user"))
		if err != nil {
			return apis.NewApiError(http.StatusForbidden, "subscription not found", nil)
		}

		if hasPro(subscription) {
			return e.Next()
		}

		if watch.GetBool("is_frozen") {
			return apis.NewApiError(http.StatusForbidden, "ProjectFrozen", map[string]any{
				"message": "This project is frozen because your plan limit is 2 active projects. Reactivate Pro or archive another watch to unlock.",
			})
		}

		// Count existing photos for this watch.
		photos, err := e.App.FindRecordsByFilter(
			"watch_photos",
			"watch = {:watchId}",
			"-created",
			freePhotoLimit+1,
			0,
			dbx.Params{"watchId": watchID},
		)
		if err != nil {
			return fmt.Errorf("photo count query failed: %w", err)
		}
		if len(photos) >= freePhotoLimit {
			return apis.NewApiError(
				http.StatusForbidden,
				fmt.Sprintf("free accounts are limited to %d photos per project", freePhotoLimit),
				nil,
			)
		}

		return e.Next()
	})

	// Block updates to frozen watches for free-tier users.
	app.OnRecordUpdate("watches").BindFunc(func(e *core.RecordEvent) error {
		if !e.Record.GetBool("is_frozen") {
			return e.Next()
		}
		userID := e.Record.GetString("user")
		subscription, err := e.App.FindFirstRecordByData("subscriptions", "user", userID)
		if err != nil || hasPro(subscription) {
			return e.Next()
		}
		return apis.NewApiError(http.StatusForbidden, "ProjectFrozen", map[string]any{
			"message": "This project is frozen because your plan limit is 2 active projects. Reactivate Pro or archive another watch to unlock.",
		})
	})

	// Block timegrapher readings on frozen watches for free-tier users.
	app.OnRecordCreate("timegrapher_readings").BindFunc(func(e *core.RecordEvent) error {
		watchID := e.Record.GetString("watch")
		watch, err := e.App.FindRecordById("watches", watchID)
		if err != nil {
			return apis.NewApiError(http.StatusBadRequest, "watch not found", nil)
		}
		if !watch.GetBool("is_frozen") {
			return e.Next()
		}
		subscription, err := e.App.FindFirstRecordByData("subscriptions", "user", watch.GetString("user"))
		if err != nil || hasPro(subscription) {
			return e.Next()
		}
		return apis.NewApiError(http.StatusForbidden, "ProjectFrozen", map[string]any{
			"message": "This project is frozen because your plan limit is 2 active projects. Reactivate Pro or archive another watch to unlock.",
		})
	})

	// Block creating repair posts on frozen watches for free-tier users.
	app.OnRecordCreate("repair_posts").BindFunc(func(e *core.RecordEvent) error {
		watchID := e.Record.GetString("watch")
		if watchID == "" {
			return e.Next() // standalone post not tied to a watch
		}
		watch, err := e.App.FindRecordById("watches", watchID)
		if err != nil || !watch.GetBool("is_frozen") {
			return e.Next()
		}
		subscription, err := e.App.FindFirstRecordByData("subscriptions", "user", watch.GetString("user"))
		if err != nil || hasPro(subscription) {
			return e.Next()
		}
		return apis.NewApiError(http.StatusForbidden, "ProjectFrozen", map[string]any{
			"message": "This project is frozen because your plan limit is 2 active projects. Reactivate Pro or archive another watch to unlock.",
		})
	})

	app.OnRecordCreate("parts_used").BindFunc(func(e *core.RecordEvent) error {
		quantityUsed := e.Record.GetInt("qty_used")
		errs := e.App.ExpandRecord(e.Record, []string{"inventory_item"}, nil)

		if len(errs) == 0 {
			inventoryRecord := e.Record.ExpandedOne("inventory_item")
			newQty := max(0, inventoryRecord.GetInt("qty")-quantityUsed)
			inventoryRecord.Set("qty", newQty)
			e.App.Save(inventoryRecord)
		} else {
			fmt.Printf("Failed to expand inventory_item for parts_used record %s: %v\n", e.Record.Id, errs)
		}

		return e.Next()
	})

	app.OnRecordDelete("parts_used").BindFunc(func(e *core.RecordEvent) error {
		quantityUsed := e.Record.GetInt("qty_used")
		errs := e.App.ExpandRecord(e.Record, []string{"inventory_item"}, nil)

		if len(errs) == 0 {
			inventoryRecord := e.Record.ExpandedOne("inventory_item")
			inventoryRecord.Set("qty", inventoryRecord.GetInt("qty")+quantityUsed)
			e.App.Save(inventoryRecord)
		}

		return e.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
