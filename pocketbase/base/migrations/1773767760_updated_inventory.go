package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3573984430")
		if err != nil {
			return err
		}

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(2, []byte(`{
			"hidden": false,
			"id": "select105650625",
			"maxSelect": 1,
			"name": "category",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "select",
			"values": [
				"movement",
				"crystal",
				"strap",
				"bracelet",
				"crown",
				"gasket",
				"hand",
				"dial",
				"bezel",
				"case",
				"tool",
				"oil",
				"other"
			]
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3573984430")
		if err != nil {
			return err
		}

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(2, []byte(`{
			"hidden": false,
			"id": "select105650625",
			"maxSelect": 1,
			"name": "category",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "select",
			"values": [
				"movement",
				"crystal",
				"strap",
				"bracelet",
				"crown",
				"gasket",
				"hand",
				"dial",
				"bezel",
				"case",
				"tool",
				"other"
			]
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
