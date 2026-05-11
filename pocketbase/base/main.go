package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"slices"
	"strings"

	"github.com/joho/godotenv"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"

	"github.com/NdoleStudio/lemonsqueezy-go"

	_ "mainspring/migrations"
)

func goDot(key string) string {

	// load .env file
	err := godotenv.Load(".env")

	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	return os.Getenv(key)
}

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

func main() {
	app := pocketbase.New()

	LS_API_KEY := goDot("LEMONSQUEEZY_API_KEY")

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

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// serves static files from the provided public dir (if exists)
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))

		return se.Next()
	})

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.POST("/api/lemonsqueezy/webhook", func(e *core.RequestEvent) error {
			secret := goDot("LEMONSQUEEZY_WEBHOOK_SECRET")

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
