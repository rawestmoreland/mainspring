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
func hasPaidSubscription(user *core.Record) bool {
	status := user.GetString("subscription_status")
	now := time.Now()

	switch status {
	case "active", "on_trial", "paid", "cancelled":
		endsAt := user.GetDateTime("ends_at")
		return endsAt.IsZero() || endsAt.Time().After(now)
	case "past_due":
		renewsAt := user.GetDateTime("renews_at")
		if renewsAt.IsZero() {
			return false
		}
		return now.Before(renewsAt.Time().Add(48 * time.Hour))
	default:
		return false
	}
}

// hasPro mirrors hasPro() in src/lib/helpers.ts.
func hasPro(user *core.Record) bool {
	return hasPaidSubscription(user)
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

	app.OnRecordCreateRequest("users").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.Record.GetString("email") == "" {
			return e.String(http.StatusBadRequest, "email is required")
		}
		if e.Record.GetString("password") == "" {
			return e.String(http.StatusBadRequest, "password is required")
		}
		if e.Record.GetString("display_name") == "" {
			return e.String(http.StatusBadRequest, "display name is required")
		}

		if err := e.Next(); err != nil {
			return err
		}

		// User is now persisted — safe to create the profile
		email := e.Record.GetString("email")
		displayName := e.Record.GetString("display_name")

		_, err := app.FindFirstRecordByFilter("user_profiles", "email = {:email}", dbx.Params{"email": email})
		if err != nil {
			if !errors.Is(err, sql.ErrNoRows) {
				return fmt.Errorf("profile lookup failed: %w", err)
			}
			collection, err := app.FindCollectionByNameOrId("user_profiles")
			if err != nil {
				return fmt.Errorf("failed to find user_profiles collection: %w", err)
			}
			profile := core.NewRecord(collection)
			profile.Set("user", e.Record.Id)
			profile.Set("email", email)
			profile.Set("display_name", displayName)
			if err := app.Save(profile); err != nil {
				return fmt.Errorf("failed to create user profile: %w", err)
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
						UserID string `json:"user_id"`
					} `json:"custom_data"`
				} `json:"meta"`
				Data struct {
					ID         string `json:"id"`
					Attributes struct {
						CustomerID int    `json:"customer_id"`
						RenewsAt   string `json:"renews_at"`
						EndsAt     string `json:"ends_at"`
						Status     string `json:"status"`
					} `json:"attributes"`
				} `json:"data"`
			}
			if err := json.Unmarshal(body, &payload); err != nil {
				return e.String(http.StatusBadRequest, "invalid json")
			}

			eventName := payload.Meta.EventName
			userID := payload.Meta.CustomData.UserID

			if (eventName == "order_created" || eventName == "subscription_created" || eventName == "subscription_payment_success") && userID != "" {
				record, err := app.FindRecordById("users", userID)
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
				}
			}

			if eventName == "subscription_expired" {
				record, err := app.FindRecordById("users", userID)
				if err == nil {
					record.Set("subscription_status", "expired")
					record.Set("renews_at", "")
					app.Save(record)
				}
			}

			if eventName == "subscription_updated" || eventName == "subscription_resumed" {
				record, err := app.FindRecordById("users", userID)
				if err == nil {
					status := payload.Data.Attributes.Status
					record.Set("subscription_status", status)
					record.Set("renews_at", payload.Data.Attributes.RenewsAt)
					app.Save(record)
				}
			}

			if eventName == "subscription_cancelled" {
				record, err := app.FindRecordById("users", userID)
				if err == nil {
					record.Set("subscription_status", payload.Data.Attributes.Status)
					record.Set("renews_at", "")
					record.Set("ends_at", payload.Data.Attributes.EndsAt)
					app.Save(record)
				}
			}

			return e.String(http.StatusOK, "ok")
		})
		return se.Next()
	})

	validateSubdomain := func(sub string) error {
		if sub == "" {
			return nil
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
		if err := validateSubdomain(e.Record.GetString("subdomain")); err != nil {
			return err
		}
		return e.Next()
	})

	app.OnRecordUpdate("user_profiles").BindFunc(func(e *core.RecordEvent) error {
		if err := validateSubdomain(e.Record.GetString("subdomain")); err != nil {
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

		user, err := e.App.FindRecordById("users", userID)
		if err != nil {
			return apis.NewApiError(http.StatusForbidden, "user not found", nil)
		}

		if hasPro(user) {
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

		user, err := e.App.FindRecordById("users", watch.GetString("user"))
		if err != nil {
			return apis.NewApiError(http.StatusForbidden, "user not found", nil)
		}

		if hasPro(user) {
			return e.Next()
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

	app.OnRecordCreate("parts_used").BindFunc(func(e *core.RecordEvent) error {
		quantityUsed := e.Record.GetInt("qty_used")
		errs := e.App.ExpandRecord(e.Record, []string{"inventory_item"}, nil)

		if len(errs) == 0 {
			inventoryRecord := e.Record.ExpandedOne("inventory_item")
			newQty := max(0, inventoryRecord.GetInt("qty")-quantityUsed)
			inventoryRecord.Set("qty", newQty)
			e.App.Save(inventoryRecord)
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
