package migrations

import (
	"encoding/json"
	"fmt"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// Frontend replacement for the totals view:
// The totals SQL view was global and cannot be filtered by user. Replace it with
// direct parameterized queries in src/routes/index.tsx:
//
//   const inv = await pb.collection('inventory').getFullList({ filter: `user = "${userId}"` })
//   const inventoryValue = inv.reduce((s, r) => s + r.qty * r.unit_cost, 0)
//   const inventoryUnits = inv.reduce((s, r) => s + r.qty, 0)
//
//   const eq = await pb.collection('equipment').getFullList({ filter: `user = "${userId}"` })
//   const equipmentValue = eq.reduce((s, r) => s + r.cost, 0)
func init() {
	m.Register(func(app core.App) error {
		record, err := app.FindFirstRecordByData("users", "email", "richard@westmorelandcreative.com")

		fmt.Println(record)

		if err != nil {
			fmt.Println(err)
			return err
		}

		collection, err := app.FindCollectionByNameOrId("pbc_2131023766")
		if err != nil {
			return err
		}

		return app.Delete(collection)
	}, func(app core.App) error {
		// Recreate the original global totals view (not user-scoped — for rollback only).
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
	})
}
