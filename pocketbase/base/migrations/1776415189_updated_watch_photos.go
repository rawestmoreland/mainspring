package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_414079043")
		if err != nil {
			return err
		}

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(2, []byte(`{
			"hidden": false,
			"id": "file3309110367",
			"maxSelect": 1,
			"maxSize": 10485760,
			"mimeTypes": [
				"image/jpeg",
				"image/png",
				"image/webp"
			],
			"name": "image",
			"presentable": false,
			"protected": false,
			"required": true,
			"system": false,
			"thumbs": [
				"100x100",
				"150x150"
			],
			"type": "file"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_414079043")
		if err != nil {
			return err
		}

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(2, []byte(`{
			"hidden": false,
			"id": "file3309110367",
			"maxSelect": 1,
			"maxSize": 10485760,
			"mimeTypes": [
				"image/jpeg",
				"image/png",
				"image/webp"
			],
			"name": "image",
			"presentable": false,
			"protected": false,
			"required": true,
			"system": false,
			"thumbs": [
				"100x100"
			],
			"type": "file"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
