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

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(5, []byte(`{
			"help": "",
			"hidden": false,
			"id": "bool3352549848",
			"name": "du_snowstorm",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "bool"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(9, []byte(`{
			"help": "",
			"hidden": false,
			"id": "bool2829828819",
			"name": "dd_snowstorm",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "bool"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(13, []byte(`{
			"help": "",
			"hidden": false,
			"id": "bool3008049239",
			"name": "cu_snowstorm",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "bool"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(17, []byte(`{
			"help": "",
			"hidden": false,
			"id": "bool3694340956",
			"name": "cd_snowstorm",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "bool"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(21, []byte(`{
			"help": "",
			"hidden": false,
			"id": "bool1727056409",
			"name": "cl_snowstorm",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "bool"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(25, []byte(`{
			"help": "",
			"hidden": false,
			"id": "bool2591040980",
			"name": "cr_snowstorm",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "bool"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_1271644974")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("bool3352549848")

		// remove field
		collection.Fields.RemoveById("bool2829828819")

		// remove field
		collection.Fields.RemoveById("bool3008049239")

		// remove field
		collection.Fields.RemoveById("bool3694340956")

		// remove field
		collection.Fields.RemoveById("bool1727056409")

		// remove field
		collection.Fields.RemoveById("bool2591040980")

		return app.Save(collection)
	})
}
