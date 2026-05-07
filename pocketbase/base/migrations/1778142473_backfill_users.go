package migrations

import (
	"fmt"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// See if we have a user for richard
		richard, err := app.FindFirstRecordByData("users", "email", "richard@westmorelandcreative.com")

		// Couldn't find the user. Bail
		if err != nil || richard.Id == "" {
			fmt.Println(err)
			return err
		}

		backfillId := richard.Id

		// get watches
		watches, err := app.FindRecordsByFilter("watches", "user = ''", "-created", 100, 0)

		if err != nil {
			return err
		}

		// backfill the user
		for i := range watches {
			record := watches[i]
			record.Set("user", backfillId)
			app.Save(record)
		}

		// get inventory
		inventory, err := app.FindRecordsByFilter("inventory", "user = ''", "-created", 100, 0)

		if err != nil {
			return err
		}

		// backfill the user
		for i := range inventory {
			record := inventory[i]
			record.Set("user", backfillId)
			app.Save(record)
		}

		// get equipment
		equipment, err := app.FindRecordsByFilter("equipment", "user = ''", "-created", 100, 0)

		if err != nil {
			return err
		}

		// backfill the equipment
		for i := range equipment {
			record := equipment[i]
			record.Set("user", backfillId)
			app.Save(record)
		}

		return nil
	}, func(app core.App) error {
		// add down queries...

		return nil
	})
}
