package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2132425296")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(2, []byte(`{
			"cascadeDelete": false,
			"collectionId": "pbc_1423682000",
			"hidden": false,
			"id": "relation1342917158",
			"maxSelect": 1,
			"minSelect": 0,
			"name": "watch",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "relation"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2132425296")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("relation1342917158")

		return app.Save(collection)
	})
}
