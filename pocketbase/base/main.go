package main

import (
	"log"
	"os"
	"regexp"
	"slices"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"

	_ "mainspring/migrations"
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

func main() {
	app := pocketbase.New()

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

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
