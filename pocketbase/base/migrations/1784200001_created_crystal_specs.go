package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		jsonData := `{
			"createRule": "@request.auth.id != \"\" && inventory.user = @request.auth.id",
			"deleteRule": "@request.auth.id != \"\" && inventory.user = @request.auth.id",
			"fields": [
				{
					"autogeneratePattern": "[a-z0-9]{15}",
					"hidden": false,
					"id": "text6060606060",
					"max": 15,
					"min": 15,
					"name": "id",
					"pattern": "^[a-z0-9]+$",
					"presentable": false,
					"primaryKey": true,
					"required": true,
					"system": true,
					"type": "text"
				},
				{
					"cascadeDelete": true,
					"collectionId": "pbc_3573984430",
					"hidden": false,
					"id": "relation7070707070",
					"maxSelect": 1,
					"minSelect": 0,
					"name": "inventory",
					"presentable": false,
					"required": true,
					"system": false,
					"type": "relation"
				},
				{
					"hidden": false,
					"id": "number8080808080",
					"max": null,
					"min": null,
					"name": "diameter_mm",
					"onlyInt": false,
					"presentable": false,
					"required": false,
					"system": false,
					"type": "number"
				},
				{
					"hidden": false,
					"id": "select9090909090",
					"maxSelect": 1,
					"name": "material",
					"presentable": false,
					"required": false,
					"system": false,
					"type": "select",
					"values": [
						"acrylic",
						"mineral",
						"sapphire"
					]
				},
				{
					"hidden": false,
					"id": "select9191919191",
					"maxSelect": 1,
					"name": "shape",
					"presentable": false,
					"required": false,
					"system": false,
					"type": "select",
					"values": [
						"flat",
						"low_dome",
						"high_dome",
						"stepped"
					]
				},
				{
					"hidden": false,
					"id": "autodate9292929292",
					"name": "created",
					"onCreate": true,
					"onUpdate": false,
					"presentable": false,
					"system": false,
					"type": "autodate"
				},
				{
					"hidden": false,
					"id": "autodate9393939393",
					"name": "updated",
					"onCreate": true,
					"onUpdate": true,
					"presentable": false,
					"system": false,
					"type": "autodate"
				}
			],
			"id": "pbc_4293847561",
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_crystal_specs_inventory` + "`" + ` ON ` + "`" + `crystal_specs` + "`" + ` (` + "`" + `inventory` + "`" + `)"
			],
			"listRule": "@request.auth.id != \"\"",
			"name": "crystal_specs",
			"system": false,
			"type": "base",
			"updateRule": "@request.auth.id != \"\" && inventory.user = @request.auth.id",
			"viewRule": "@request.auth.id != \"\""
		}`

		collection := &core.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_4293847561")
		if err != nil {
			return err
		}

		return app.Delete(collection)
	})
}
