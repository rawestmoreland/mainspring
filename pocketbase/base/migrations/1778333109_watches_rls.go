package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// Restrict watches read access:
//   - owner: authenticated user matches watch.user
//   - public profile: watch owner has user_profiles.is_public = true
func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_1423682000")
		if err != nil {
			return err
		}

		ownerOrPublic := `@request.auth.id = user.id || user.user_profiles_via_user.is_public = true`

		if err := json.Unmarshal([]byte(`{
			"listRule": "`+ownerOrPublic+`",
			"viewRule": "`+ownerOrPublic+`"
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_1423682000")
		if err != nil {
			return err
		}

		// revert to fully public read
		if err := json.Unmarshal([]byte(`{
			"listRule": "",
			"viewRule": ""
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
