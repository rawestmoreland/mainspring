package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func setCollectionRules(app core.App, collectionName string, rulesJSON string) error {
	collection, err := app.FindCollectionByNameOrId(collectionName)
	if err != nil {
		return err
	}

	if err := json.Unmarshal([]byte(rulesJSON), &collection); err != nil {
		return err
	}

	return app.Save(collection)
}

func init() {
	m.Register(func(app core.App) error {
		publicReadAdminWrite := `{
			"createRule": null,
			"deleteRule": null,
			"listRule": "",
			"updateRule": null,
			"viewRule": ""
		}`

		for _, collectionName := range []string{
			"watches",
			"watch_photos",
			"service_logs",
			"inventory",
			"parts_used",
			"equipment",
		} {
			if err := setCollectionRules(app, collectionName, publicReadAdminWrite); err != nil {
				return err
			}
		}

		totalsPublicRead := `{
			"createRule": null,
			"deleteRule": null,
			"listRule": "",
			"updateRule": null,
			"viewRule": ""
		}`

		return setCollectionRules(app, "totals", totalsPublicRead)
	}, func(app core.App) error {
		publicWriteForAuthenticated := `{
			"createRule": "",
			"deleteRule": "",
			"listRule": "",
			"updateRule": "",
			"viewRule": ""
		}`

		for _, collectionName := range []string{
			"watches",
			"watch_photos",
			"service_logs",
			"inventory",
			"parts_used",
			"equipment",
		} {
			if err := setCollectionRules(app, collectionName, publicWriteForAuthenticated); err != nil {
				return err
			}
		}

		totalsOriginal := `{
			"createRule": null,
			"deleteRule": null,
			"listRule": null,
			"updateRule": null,
			"viewRule": null
		}`

		return setCollectionRules(app, "totals", totalsOriginal)
	})
}
