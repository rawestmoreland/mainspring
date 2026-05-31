package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_1271644974")
		if err != nil {
			return err
		}

		if err := collection.Fields.AddMarshaledJSONAt(len(collection.Fields), []byte(`{
			"hidden": false,
			"id": "text_ai_analysis",
			"max": 0,
			"min": 0,
			"name": "ai_analysis",
			"pattern": "",
			"presentable": false,
			"primaryKey": false,
			"required": false,
			"system": false,
			"type": "text"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_1271644974")
		if err != nil {
			return err
		}

		collection.Fields.RemoveById("text_ai_analysis")

		return app.Save(collection)
	})
}
