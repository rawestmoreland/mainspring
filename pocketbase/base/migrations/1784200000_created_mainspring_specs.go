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
					"id": "text1010101010",
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
					"id": "relation2020202020",
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
					"id": "number3030303030",
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
					"id": "number3131313131",
					"max": null,
					"min": null,
					"name": "height_mm",
					"onlyInt": false,
					"presentable": false,
					"required": false,
					"system": false,
					"type": "number"
				},
				{
					"hidden": false,
					"id": "number3232323232",
					"max": null,
					"min": null,
					"name": "thickness_mm",
					"onlyInt": false,
					"presentable": false,
					"required": false,
					"system": false,
					"type": "number"
				},
				{
					"hidden": false,
					"id": "number3333333333",
					"max": null,
					"min": null,
					"name": "length_mm",
					"onlyInt": false,
					"presentable": false,
					"required": false,
					"system": false,
					"type": "number"
				},
				{
					"hidden": false,
					"id": "select4040404040",
					"maxSelect": 1,
					"name": "type",
					"presentable": false,
					"required": false,
					"system": false,
					"type": "select",
					"values": [
						"automatic_bridle",
						"manual_reverse_eye"
					]
				},
				{
					"hidden": false,
					"id": "autodate5050505050",
					"name": "created",
					"onCreate": true,
					"onUpdate": false,
					"presentable": false,
					"system": false,
					"type": "autodate"
				},
				{
					"hidden": false,
					"id": "autodate5151515151",
					"name": "updated",
					"onCreate": true,
					"onUpdate": true,
					"presentable": false,
					"system": false,
					"type": "autodate"
				}
			],
			"id": "pbc_4102938475",
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_mainspring_specs_inventory` + "`" + ` ON ` + "`" + `mainspring_specs` + "`" + ` (` + "`" + `inventory` + "`" + `)"
			],
			"listRule": "@request.auth.id != \"\"",
			"name": "mainspring_specs",
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
		collection, err := app.FindCollectionByNameOrId("pbc_4102938475")
		if err != nil {
			return err
		}

		return app.Delete(collection)
	})
}
