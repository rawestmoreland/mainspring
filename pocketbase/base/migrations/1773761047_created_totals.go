package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		jsonData := `{
			"createRule": null,
			"deleteRule": null,
			"fields": [
				{
					"autogeneratePattern": "",
					"hidden": false,
					"id": "text3208210256",
					"max": 0,
					"min": 0,
					"name": "id",
					"pattern": "^[a-z0-9]+$",
					"presentable": false,
					"primaryKey": true,
					"required": true,
					"system": true,
					"type": "text"
				},
				{
					"hidden": false,
					"id": "json3253465908",
					"maxSize": 1,
					"name": "inventory_value",
					"presentable": false,
					"required": false,
					"system": false,
					"type": "json"
				},
				{
					"hidden": false,
					"id": "json892133193",
					"maxSize": 1,
					"name": "inventory_units",
					"presentable": false,
					"required": false,
					"system": false,
					"type": "json"
				},
				{
					"hidden": false,
					"id": "json4096686544",
					"maxSize": 1,
					"name": "equipment_value",
					"presentable": false,
					"required": false,
					"system": false,
					"type": "json"
				}
			],
			"id": "pbc_2131023766",
			"indexes": [],
			"listRule": null,
			"name": "totals",
			"system": false,
			"type": "view",
			"updateRule": null,
			"viewQuery": "SELECT\n    (ROW_NUMBER() OVER())     AS id,\n    SUM(i.qty * i.unit_cost)  AS inventory_value,\n    SUM(i.qty)                AS inventory_units,\n    (SELECT SUM(e.cost) FROM equipment e) AS equipment_value\nFROM inventory i",
			"viewRule": null
		}`

		collection := &core.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2131023766")
		if err != nil {
			return err
		}

		return app.Delete(collection)
	})
}
