package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3573984430")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"indexes": [
				"CREATE INDEX ` + "`" + `idx_inventory_category` + "`" + ` ON ` + "`" + `inventory` + "`" + ` (category)",
				"CREATE INDEX ` + "`" + `idx_imqSezJFee` + "`" + ` ON ` + "`" + `inventory` + "`" + ` (` + "`" + `user` + "`" + `)"
			]
		}`), &collection); err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("bool2601427943")

		// remove field
		collection.Fields.RemoveById("json2699345294")

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(3, []byte(`{
			"hidden": false,
			"id": "select105650625",
			"maxSelect": 1,
			"name": "category",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "select",
			"values": [
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
				"other",
				"mainspring"
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

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"indexes": [
				"CREATE INDEX ` + "`" + `idx_inventory_category` + "`" + ` ON ` + "`" + `inventory` + "`" + ` (category)"
			]
		}`), &collection); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(8, []byte(`{
			"hidden": false,
			"id": "bool2601427943",
			"name": "is_donor",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "bool"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(9, []byte(`{
			"hidden": false,
			"id": "json2699345294",
			"maxSize": 0,
			"name": "missing_parts",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "json"
		}`)); err != nil {
			return err
		}

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(3, []byte(`{
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
				"other",
				"mainspring"
			]
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
