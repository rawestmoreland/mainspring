package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"log"
	"math"
	"net/http"
	"net/mail"
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
	"github.com/pocketbase/pocketbase/tools/mailer"

	"github.com/NdoleStudio/lemonsqueezy-go"

	_ "mainspring/migrations"
)

func init() {
	// Load .env in local dev; in production (Fly.io) secrets are already env vars
	_ = godotenv.Load()
}

var (
	subdomainRe = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$`)

	appTrialDuration       = 14 * 24 * time.Hour
	trialReminderHorizon   = 3 * 24 * time.Hour
	defaultPublicAppOrigin = "https://hairspring.app"

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

// hasPaidSubscription mirrors hasPaidSubscription() in src/lib/helpers.ts (Lemon Squeezy only).
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

func hasActiveAppTrial(user *core.Record) bool {
	t := user.GetDateTime("trial_ends_at")
	if t.IsZero() {
		return false
	}
	return t.Time().After(time.Now())
}

// hasPro mirrors hasPro() in src/lib/helpers.ts (paid subscription or app-level trial).
func hasPro(user *core.Record) bool {
	if hasPaidSubscription(user) {
		return true
	}
	return hasActiveAppTrial(user)
}

func appOrigin() string {
	if v := strings.TrimSpace(os.Getenv("APP_URL")); v != "" {
		return strings.TrimRight(v, "/")
	}
	return defaultPublicAppOrigin
}

func sendTrialExpiryReminders(app core.App) {
	records, err := app.FindRecordsByFilter(
		"users",
		"trial_expiry_email_sent = false && trial_ends_at != ''",
		"trial_ends_at",
		500,
		0,
	)
	if err != nil {
		log.Println("trial reminder query:", err)
		return
	}

	now := time.Now()
	mailClient := app.NewMailClient()
	meta := app.Settings().Meta

	for _, rec := range records {
		if hasPaidSubscription(rec) {
			continue
		}

		trialEnd := rec.GetDateTime("trial_ends_at")
		if trialEnd.IsZero() {
			continue
		}
		end := trialEnd.Time()
		if !end.After(now) {
			continue
		}
		if end.Sub(now) > trialReminderHorizon {
			continue
		}

		days := int(math.Ceil(end.Sub(now).Hours() / 24))
		if days < 1 {
			days = 1
		}

		addr := rec.Email()
		if addr == "" {
			continue
		}

		base := appOrigin()
		proURL := base + "/pro"
		endLocal := end.UTC().Format("January 2, 2006")

		msg := &mailer.Message{
			From: mail.Address{
				Address: meta.SenderAddress,
				Name:    meta.SenderName,
			},
			To: []mail.Address{{Address: addr}},
			Subject: fmt.Sprintf(
				"Your Hairspring Pro trial ends in %d day(s)",
				days,
			),
			HTML: fmt.Sprintf(
				`<p>Hi,</p>
<p>Your free Pro trial (no credit card required) ends on <strong>%s</strong> — about <strong>%d</strong> day(s) from now.</p>
<p>Subscribe anytime to keep photo uploads, timegrapher logging, shopping lists, and the rest of Pro.</p>
<p><a href="%s">View Pro plans</a></p>
<p>— Hairspring</p>`,
				html.EscapeString(endLocal),
				days,
				html.EscapeString(proURL),
			),
		}

		if err := mailClient.Send(msg); err != nil {
			log.Println("trial reminder email:", rec.Id, err)
			continue
		}

		rec.Set("trial_expiry_email_sent", true)
		if err := app.Save(rec); err != nil {
			log.Println("trial reminder save:", rec.Id, err)
		}
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

		if e.Record.GetDateTime("trial_ends_at").IsZero() {
			e.Record.Set("trial_ends_at", time.Now().UTC().Add(appTrialDuration))
		}

		if err := e.Next(); err != nil {
			return err
		}

		// User is now persisted — safe to create the profile
		email := e.Record.GetString("email")
		displayName := e.Record.GetString("display_name")

		_, err := app.FindFirstRecordByFilter("user_profiles", "email = {:email}", dbx.Params{"email": email})
		if err != nil {
			if !app.IsNotFound(err) {
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
		se.Router.POST("/api/internal/trigger-trial-reminders", func(e *core.RequestEvent) error {
			secret := os.Getenv("INTERNAL_CRON_SECRET")
			if secret == "" || e.Request.Header.Get("X-Cron-Secret") != secret {
				return e.String(http.StatusUnauthorized, "unauthorized")
			}
			sendTrialExpiryReminders(app)
			return e.String(http.StatusOK, "ok")
		})
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
					// Revoke access entirely
					record.Set("subscription_status", "expired")
					// Optional: Clear the renewal date since it's no longer relevant
					record.Set("renews_at", "")
					app.Save(record)
				}
			}

			if eventName == "subscription_updated" || eventName == "subscription_resumed" {
				record, err := app.FindRecordById("users", userID)
				if err == nil {
					// Sync the current status (active, past_due, paused, etc.)
					status := payload.Data.Attributes.Status
					record.Set("subscription_status", status)

					// Always sync renewal date; null from LS unmarshals to "" which is correct
					record.Set("renews_at", payload.Data.Attributes.RenewsAt)

					// If the status is 'cancelled' but not yet expired,
					// they are in the "grace period." You might want to log this.
					if status == "cancelled" {
						// Logic to notify user they are on their last month
					}

					app.Save(record)
				}
			}

			if eventName == "subscription_cancelled" {
				record, err := app.FindRecordById("users", userID)
				if err == nil {
					// Sync the current status (active, past_due, paused, etc.)
					status := payload.Data.Attributes.Status
					record.Set("subscription_status", status)
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

		if !hasPro(user) {
			return apis.NewApiError(http.StatusForbidden, "pro subscription required to upload photos", nil)
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
