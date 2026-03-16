package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {

		// ── 1. watches ───────────────────────────────────────────────────────
		watches := core.NewBaseCollection("watches")

		watches.ListRule   = types.Pointer("@request.auth.id != ''")
		watches.ViewRule   = types.Pointer("@request.auth.id != ''")
		watches.CreateRule = types.Pointer("@request.auth.id != ''")
		watches.UpdateRule = types.Pointer("@request.auth.id != ''")
		watches.DeleteRule = types.Pointer("@request.auth.id != ''")

		watches.Fields.Add(
			// Identity
			&core.TextField{Name: "make",      Required: true,  Min: 1, Max: 100},
			&core.TextField{Name: "model",     Required: true,  Min: 1, Max: 100},
			&core.TextField{Name: "reference", Required: false, Max: 100},
			&core.NumberField{Name: "year",    Required: false, Min: types.Pointer(1800.0), Max: types.Pointer(2100.0), OnlyInt: true},
			&core.TextField{Name: "serial",    Required: false, Max: 100},

			// Status & condition
			&core.SelectField{
				Name:      "status",
				Required:  true,
				MaxSelect: 1,
				Values:    []string{"acquired", "in_progress", "listed", "sold"},
			},
			&core.SelectField{
				Name:      "condition_bought",
				Required:  false,
				MaxSelect: 1,
				Values:    []string{"mint", "good", "fair", "worn", "poor", "parts_only"},
			},

			// Financials
			&core.NumberField{Name: "bought_price", Required: true,  Min: types.Pointer(0.0)},
			&core.NumberField{Name: "sold_price",   Required: false, Min: types.Pointer(0.0)},

			// Denormalised sum of service_logs.hours for fast dashboard queries
			&core.NumberField{Name: "hours_spent", Required: false, Min: types.Pointer(0.0)},

			// Dates
			&core.DateField{Name: "bought_date", Required: true},
			&core.DateField{Name: "sold_date",   Required: false},

			// Notes & listing URL
			&core.TextField{Name: "notes",       Required: false, Max: 5000},
			&core.URLField{Name:  "listing_url", Required: false},

			// Timestamps
			&core.AutodateField{Name: "created", OnCreate: true},
			&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
		)

		watches.AddIndex("idx_watches_status", false, "status", "")

		if err := app.Save(watches); err != nil {
			return err
		}

		// ── 2. watch_photos ──────────────────────────────────────────────────
		// Separate collection (not a file field on watches) so each photo
		// carries its own stage tag, caption, and sort order.
		watchPhotos := core.NewBaseCollection("watch_photos")

		watchPhotos.ListRule   = types.Pointer("@request.auth.id != ''")
		watchPhotos.ViewRule   = types.Pointer("@request.auth.id != ''")
		watchPhotos.CreateRule = types.Pointer("@request.auth.id != ''")
		watchPhotos.UpdateRule = types.Pointer("@request.auth.id != ''")
		watchPhotos.DeleteRule = types.Pointer("@request.auth.id != ''")

		watchPhotos.Fields.Add(
			&core.RelationField{
				Name:          "watch",
				Required:      true,
				CollectionId:  watches.Id,
				CascadeDelete: true,
				MaxSelect:     1,
			},
			&core.FileField{
				Name:      "image",
				Required:  true,
				MaxSelect: 1,
				MaxSize:   10485760, // 10 MB
				MimeTypes: []string{"image/jpeg", "image/png", "image/webp", "image/heic"},
			},
			&core.SelectField{
				Name:      "stage",
				Required:  true,
				MaxSelect: 1,
				Values:    []string{"before", "during", "after", "listing"},
			},
			&core.TextField{Name:   "caption",    Required: false, Max: 500},
			&core.NumberField{Name: "sort_order", Required: false, Min: types.Pointer(0.0), OnlyInt: true},

			&core.AutodateField{Name: "created", OnCreate: true},
			&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
		)

		watchPhotos.AddIndex("idx_watch_photos_watch", false, "watch", "")
		watchPhotos.AddIndex("idx_watch_photos_stage", false, "stage", "")

		if err := app.Save(watchPhotos); err != nil {
			return err
		}

		// ── 3. service_logs ──────────────────────────────────────────────────
		// Individual bench session entries per watch (e.g. "2h demagnetising").
		// watches.hours_spent is a denormalised sum for fast dashboard queries.
		serviceLogs := core.NewBaseCollection("service_logs")

		serviceLogs.ListRule   = types.Pointer("@request.auth.id != ''")
		serviceLogs.ViewRule   = types.Pointer("@request.auth.id != ''")
		serviceLogs.CreateRule = types.Pointer("@request.auth.id != ''")
		serviceLogs.UpdateRule = types.Pointer("@request.auth.id != ''")
		serviceLogs.DeleteRule = types.Pointer("@request.auth.id != ''")

		serviceLogs.Fields.Add(
			&core.RelationField{
				Name:          "watch",
				Required:      true,
				CollectionId:  watches.Id,
				CascadeDelete: true,
				MaxSelect:     1,
			},
			&core.DateField{Name:   "date",        Required: true},
			&core.NumberField{Name: "hours",       Required: true, Min: types.Pointer(0.0)},
			&core.TextField{Name:   "description", Required: false, Max: 1000},

			&core.AutodateField{Name: "created", OnCreate: true},
			&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
		)

		serviceLogs.AddIndex("idx_service_logs_watch", false, "watch", "")

		if err := app.Save(serviceLogs); err != nil {
			return err
		}

		// ── 4. inventory ─────────────────────────────────────────────────────
		// Spare parts stock. qty is decremented when a part is used on a watch.
		inventory := core.NewBaseCollection("inventory")

		inventory.ListRule   = types.Pointer("@request.auth.id != ''")
		inventory.ViewRule   = types.Pointer("@request.auth.id != ''")
		inventory.CreateRule = types.Pointer("@request.auth.id != ''")
		inventory.UpdateRule = types.Pointer("@request.auth.id != ''")
		inventory.DeleteRule = types.Pointer("@request.auth.id != ''")

		inventory.Fields.Add(
			&core.TextField{Name: "name", Required: true, Min: 1, Max: 200},
			&core.SelectField{
				Name:      "category",
				Required:  false,
				MaxSelect: 1,
				Values: []string{
					"movement", "crystal", "strap", "bracelet",
					"crown", "gasket", "hand", "dial", "bezel",
					"case", "tool", "other",
				},
			},
			&core.NumberField{Name: "qty",       Required: true,  Min: types.Pointer(0.0), OnlyInt: true},
			&core.NumberField{Name: "unit_cost", Required: false, Min: types.Pointer(0.0)},
			&core.TextField{Name:  "supplier",   Required: false, Max: 200},
			&core.TextField{Name:  "notes",      Required: false, Max: 1000},

			&core.AutodateField{Name: "created", OnCreate: true},
			&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
		)

		inventory.AddIndex("idx_inventory_category", false, "category", "")

		if err := app.Save(inventory); err != nil {
			return err
		}

		// ── 5. parts_used ────────────────────────────────────────────────────
		// Junction: which inventory parts were consumed by which watch.
		// Snapshots part_name and unit_cost at time of use so historical costs
		// stay accurate if the inventory record is later edited or deleted.
		partsUsed := core.NewBaseCollection("parts_used")

		partsUsed.ListRule   = types.Pointer("@request.auth.id != ''")
		partsUsed.ViewRule   = types.Pointer("@request.auth.id != ''")
		partsUsed.CreateRule = types.Pointer("@request.auth.id != ''")
		partsUsed.UpdateRule = types.Pointer("@request.auth.id != ''")
		partsUsed.DeleteRule = types.Pointer("@request.auth.id != ''")

		partsUsed.Fields.Add(
			&core.RelationField{
				Name:          "watch",
				Required:      true,
				CollectionId:  watches.Id,
				CascadeDelete: true,
				MaxSelect:     1,
			},
			// Nullable — allows logging a part that's no longer in inventory
			&core.RelationField{
				Name:          "inventory_item",
				Required:      false,
				CollectionId:  inventory.Id,
				CascadeDelete: false,
				MaxSelect:     1,
			},
			// Snapshot fields — preserved even if the inventory record changes
			&core.TextField{Name:   "part_name", Required: true,  Min: 1, Max: 200},
			&core.NumberField{Name: "qty_used",  Required: true,  Min: types.Pointer(0.0)},
			&core.NumberField{Name: "unit_cost", Required: false, Min: types.Pointer(0.0)},
			&core.DateField{Name:   "date_used", Required: false},
			&core.TextField{Name:   "notes",     Required: false, Max: 500},

			&core.AutodateField{Name: "created", OnCreate: true},
			&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
		)

		partsUsed.AddIndex("idx_parts_used_watch", false, "watch", "")

		if err := app.Save(partsUsed); err != nil {
			return err
		}

		// ── 6. equipment ─────────────────────────────────────────────────────
		// One-time tool and equipment purchases (capex, not per-watch costs).
		equipment := core.NewBaseCollection("equipment")

		equipment.ListRule   = types.Pointer("@request.auth.id != ''")
		equipment.ViewRule   = types.Pointer("@request.auth.id != ''")
		equipment.CreateRule = types.Pointer("@request.auth.id != ''")
		equipment.UpdateRule = types.Pointer("@request.auth.id != ''")
		equipment.DeleteRule = types.Pointer("@request.auth.id != ''")

		equipment.Fields.Add(
			&core.TextField{Name:   "name",          Required: true,  Min: 1, Max: 200},
			&core.NumberField{Name: "cost",          Required: true,  Min: types.Pointer(0.0)},
			&core.DateField{Name:   "date_acquired", Required: false},
			&core.TextField{Name:   "supplier",      Required: false, Max: 200},
			&core.TextField{Name:   "notes",         Required: false, Max: 1000},

			&core.AutodateField{Name: "created", OnCreate: true},
			&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
		)

		return app.Save(equipment)

	}, func(app core.App) error {

		// ── DOWN ─────────────────────────────────────────────────────────────
		// Delete in reverse dependency order so relation constraints
		// don't block deletion.
		for _, name := range []string{
			"parts_used",
			"service_logs",
			"watch_photos",
			"watches",
			"inventory",
			"equipment",
		} {
			col, err := app.FindCollectionByNameOrId(name)
			if err != nil {
				return err
			}
			if err := app.Delete(col); err != nil {
				return err
			}
		}

		return nil
	})
}