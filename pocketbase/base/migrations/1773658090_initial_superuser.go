package migrations

import (
	"fmt"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
    m.Register(func(app core.App) error {
        superusers, err := app.FindCollectionByNameOrId(core.CollectionNameSuperusers)
        if err != nil {
            return err
        }

        record := core.NewRecord(superusers)

        // note: the values can be eventually loaded via os.Getenv(key)
        // or from a special local config file
        record.Set("email", "richard@westmorelandcreative.com")
        record.Set("password", "Testing12345")

				err = app.Save(record)

				if err != nil {
					fmt.Println((err))
					return nil
				}

				usersCollection, err := app.FindCollectionByNameOrId("users")

				if err != nil {
					fmt.Println("Unable to find the users collection")
					return nil
				}

				// Create the first auth user
				newRecord := core.NewRecord(usersCollection)

				newRecord.Set("email", "richard@westmorelandcreative.com")
				newRecord.Set("password", "Testing12345")

				err = app.Save(newRecord)

				if err != nil {
					fmt.Println(err)
				}

				return nil
    }, func(app core.App) error { // optional revert operation
        record, _ := app.FindAuthRecordByEmail(core.CollectionNameSuperusers, "richard@westmorelandcreative.com")
        if record == nil {
            return nil // probably already deleted
        }

        return app.Delete(record)
    })
}