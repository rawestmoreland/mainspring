package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		jsonData := `{
			"createRule": "@request.auth.id != \"\" && @request.auth.id = user.id",
			"deleteRule": "@request.auth.id != \"\" && @request.auth.id = user.id",
			"fields": [
				{
					"autogeneratePattern": "[a-z0-9]{15}",
					"hidden": false,
					"id": "text3208210256",
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
				},
				{
					"cascadeDelete": true,
					"collectionId": "pbc_1423682000",
					"hidden": false,
					"id": "relation1342917158",
					"maxSelect": 1,
					"minSelect": 0,
					"name": "watch",
					"presentable": false,
					"required": true,
					"system": false,
					"type": "relation"
				},
				{
					"autogeneratePattern": "",
					"hidden": false,
					"id": "text1579384326",
					"max": 256,
					"min": 0,
					"name": "name",
					"pattern": "",
					"presentable": false,
					"primaryKey": false,
					"required": true,
					"system": false,
					"type": "text"
				},
				{
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
						"mainspring",
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
				},
				{
					"hidden": false,
					"id": "number1986247125",
					"max": null,
					"min": null,
					"name": "target_price",
					"onlyInt": false,
					"presentable": false,
					"required": false,
					"system": false,
					"type": "number"
				},
				{
					"autogeneratePattern": "",
					"hidden": false,
					"id": "text18589324",
					"max": 0,
					"min": 0,
					"name": "notes",
					"pattern": "",
					"presentable": false,
					"primaryKey": false,
					"required": false,
					"system": false,
					"type": "text"
				},
				{
					"hidden": false,
					"id": "select2063623452",
					"maxSelect": 1,
					"name": "status",
					"presentable": false,
					"required": true,
					"system": false,
					"type": "select",
					"values": [
						"needed",
						"ordered",
						"in_hand"
					]
				},
				{
					"hidden": false,
					"id": "autodate2990389176",
					"name": "created",
					"onCreate": true,
					"onUpdate": false,
					"presentable": false,
					"system": false,
					"type": "autodate"
				},
				{
					"hidden": false,
					"id": "autodate3332085495",
					"name": "updated",
					"onCreate": true,
					"onUpdate": true,
					"presentable": false,
					"system": false,
					"type": "autodate"
				}
			],
			"id": "pbc_2338969664",
			"indexes": [
				"CREATE INDEX ` + "`" + `idx_GfOFj2R6kc` + "`" + ` ON ` + "`" + `watch_parts_shopping_list` + "`" + ` (` + "`" + `user` + "`" + `)",
				"CREATE INDEX ` + "`" + `idx_lWu5RAiB1J` + "`" + ` ON ` + "`" + `watch_parts_shopping_list` + "`" + ` (` + "`" + `watch` + "`" + `)"
			],
			"listRule": null,
			"name": "watch_parts_shopping_list",
			"system": false,
			"type": "base",
			"updateRule": "@request.auth.id != \"\" && @request.auth.id = user.id",
			"viewRule": null
		}`

		collection := &core.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2338969664")
		if err != nil {
			return err
		}

		return app.Delete(collection)
	})
}
