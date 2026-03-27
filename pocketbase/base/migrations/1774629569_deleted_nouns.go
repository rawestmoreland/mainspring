package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_678144923")
		if err != nil {
			return err
		}

		return app.Delete(collection)
	}, func(app core.App) error {
		jsonData := `{
			"createRule": null,
			"deleteRule": null,
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
					"autogeneratePattern": "",
					"hidden": false,
					"id": "text2721333409",
					"max": 0,
					"min": 0,
					"name": "german",
					"pattern": "",
					"presentable": false,
					"primaryKey": false,
					"required": true,
					"system": false,
					"type": "text"
				},
				{
					"hidden": false,
					"id": "select37359206",
					"maxSelect": 1,
					"name": "article",
					"presentable": false,
					"required": true,
					"system": false,
					"type": "select",
					"values": [
						"der",
						"die",
						"das"
					]
				},
				{
					"autogeneratePattern": "",
					"hidden": false,
					"id": "text3579096363",
					"max": 0,
					"min": 0,
					"name": "plural",
					"pattern": "",
					"presentable": false,
					"primaryKey": false,
					"required": false,
					"system": false,
					"type": "text"
				},
				{
					"autogeneratePattern": "",
					"hidden": false,
					"id": "text746783232",
					"max": 0,
					"min": 0,
					"name": "english",
					"pattern": "",
					"presentable": false,
					"primaryKey": false,
					"required": false,
					"system": false,
					"type": "text"
				},
				{
					"hidden": false,
					"id": "select2599078931",
					"maxSelect": 1,
					"name": "level",
					"presentable": false,
					"required": true,
					"system": false,
					"type": "select",
					"values": [
						"A1",
						"A2",
						"B1",
						"B2",
						"C1",
						"C2"
					]
				},
				{
					"cascadeDelete": false,
					"collectionId": "pbc_3292755704",
					"hidden": false,
					"id": "relation105650625",
					"maxSelect": 1,
					"minSelect": 0,
					"name": "category",
					"presentable": false,
					"required": true,
					"system": false,
					"type": "relation"
				},
				{
					"hidden": false,
					"id": "select1542800728",
					"maxSelect": 2,
					"name": "sources",
					"presentable": false,
					"required": false,
					"system": false,
					"type": "select",
					"values": [
						"Schritte Plus Neu",
						"Goethe",
						"Nicos Weg",
						"Daf Kompakt"
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
				},
				{
					"autogeneratePattern": "",
					"hidden": false,
					"id": "text2866593110",
					"max": 0,
					"min": 0,
					"name": "translation_key",
					"pattern": "",
					"presentable": false,
					"primaryKey": false,
					"required": false,
					"system": false,
					"type": "text"
				},
				{
					"autogeneratePattern": "",
					"hidden": false,
					"id": "text254489595",
					"max": 0,
					"min": 0,
					"name": "sense",
					"pattern": "",
					"presentable": false,
					"primaryKey": false,
					"required": false,
					"system": false,
					"type": "text"
				}
			],
			"id": "pbc_678144923",
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_nouns_german_article_sense` + "`" + ` ON ` + "`" + `nouns` + "`" + ` (german, article, COALESCE(sense, ''))"
			],
			"listRule": "",
			"name": "nouns",
			"system": false,
			"type": "base",
			"updateRule": null,
			"viewRule": ""
		}`

		collection := &core.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
