package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2190040129")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"createRule": "@request.auth.id != \"\" && @request.auth.id = user.id && @request.body.is_admin:isset = false",
			"updateRule": "@request.auth.id != \"\" && @request.auth.id = user.id && @request.body.is_admin:isset = false"
		}`), &collection); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(6, []byte(`{
			"hidden": false,
			"id": "bool3304254982",
			"name": "is_admin",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "bool"
		}`)); err != nil {
			return err
		}

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(2, []byte(`{
			"autogeneratePattern": "[a-z0-9]{10}",
			"hidden": false,
			"id": "text3252000302",
			"max": 0,
			"min": 0,
			"name": "subdomain",
			"pattern": "^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$",
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
		collection, err := app.FindCollectionByNameOrId("pbc_2190040129")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"createRule": "@request.auth.id != \"\" && @request.auth.id = user.id",
			"updateRule": "@request.auth.id != \"\" && @request.auth.id = user.id"
		}`), &collection); err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("bool3304254982")

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(2, []byte(`{
			"autogeneratePattern": "",
			"hidden": false,
			"id": "text3252000302",
			"max": 0,
			"min": 0,
			"name": "subdomain",
			"pattern": "^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$",
			"presentable": false,
			"primaryKey": false,
			"required": false,
			"system": false,
			"type": "text"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
