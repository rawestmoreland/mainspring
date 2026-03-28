package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_1423682000")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("text18589324")

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(15, []byte(`{
			"convertURLs": false,
			"hidden": false,
			"id": "editor18589324",
			"maxSize": 0,
			"name": "notes",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "editor"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_1423682000")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(14, []byte(`{
			"autogeneratePattern": "",
			"hidden": false,
			"id": "text18589324",
			"max": 5000,
			"min": 0,
			"name": "notes",
			"pattern": "",
			"presentable": false,
			"primaryKey": false,
			"required": false,
			"system": false,
			"type": "text"
		}`)); err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("editor18589324")

		return app.Save(collection)
	})
}
