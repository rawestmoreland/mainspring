package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3980638064")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_c7MNRw1CzV` + "`" + ` ON ` + "`" + `subscriptions` + "`" + ` (` + "`" + `user` + "`" + `)"
			],
			"viewRule": "@request.auth.id != \"\" && @request.auth.id = user.id"
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3980638064")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"indexes": [
				"CREATE INDEX ` + "`" + `idx_c7MNRw1CzV` + "`" + ` ON ` + "`" + `subscriptions` + "`" + ` (` + "`" + `user` + "`" + `)"
			],
			"viewRule": "@request.auth.id != \"\" && @request.auth.id = id"
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
