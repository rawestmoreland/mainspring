package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		col, err := app.FindCollectionByNameOrId("parts_used")
		if err != nil {
			return err
		}

		col.Fields.RemoveByName("part_name")
		col.Fields.RemoveByName("unit_cost")

		return app.Save(col)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId("parts_used")
		if err != nil {
			return err
		}

		col.Fields.Add(
			&core.TextField{Name: "part_name", Required: true, Min: 1, Max: 200},
			&core.NumberField{Name: "unit_cost", Required: false},
		)

		return app.Save(col)
	})
}
