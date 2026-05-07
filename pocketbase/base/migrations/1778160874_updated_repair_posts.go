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
		if err := collection.Fields.AddMarshaledJSONAt(6, []byte(`{
			"cascadeDelete": true,
			"collectionId": "_pb_users_auth_",
			"hidden": false,
			"id": "relation2375276105",
			"maxSelect": 1,
			"minSelect": 0,
			"name": "user",
			"presentable": false,
			"required": true,
			"system": false,
			"type": "relation"
		}`)); err != nil {
			return err
		}

		err = app.Save(collection)

		if err != nil {
			return err
		}

		record, err := app.FindAuthRecordByEmail("users", "richard@westmorelandcreative.com")

		if err != nil {
			return nil
		}

		posts, err := app.FindRecordsByFilter("repair_posts", "user = ''", "-created", 100, 0)

		if err != nil {
			return nil
		}

		for _, item := range posts {
       record = item
			 item.Set("user", record.Id)
			 app.Save(record)
		}
return nil
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2132425296")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("relation2375276105")

		return app.Save(collection)
	})
}
