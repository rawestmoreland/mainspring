package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// Replace the full unique index on subdomain with a partial one so that
		// multiple profiles can have an empty subdomain without conflicting.
		if _, err := app.DB().NewQuery("DROP INDEX IF EXISTS `idx_OSFlI2FE1h`").Execute(); err != nil {
			return err
		}
		_, err := app.DB().NewQuery("CREATE UNIQUE INDEX `idx_subdomain_nonempty` ON `user_profiles` (`subdomain`) WHERE subdomain != ''").Execute()
		return err
	}, func(app core.App) error {
		if _, err := app.DB().NewQuery("DROP INDEX IF EXISTS `idx_subdomain_nonempty`").Execute(); err != nil {
			return err
		}
		_, err := app.DB().NewQuery("CREATE UNIQUE INDEX `idx_OSFlI2FE1h` ON `user_profiles` (`subdomain`)").Execute()
		return err
	})
}
