package migrations

import (
	"fmt"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// The superuser is always guaranteed to exist from the initial migration
		richard, err := app.FindAuthRecordByEmail("users", "richard@westmorelandcreative.com")

		if err != nil {
			fmt.Println(err)
			return err
		}

		backfillId := richard.Id

		collections := []string{"watches", "inventory", "equipment"}

		for _, col := range collections {
			records, err := app.FindRecordsByFilter(col, "user = ''", "-created", 100, 0)
			if err != nil {
				continue
			}
			for i := range records {
				records[i].Set("user", backfillId)
				app.Save(records[i])
			}
		}

		return nil
	}, func(app core.App) error {
		// add down queries...

		return nil
	})
}
