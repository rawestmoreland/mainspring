package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3142635823")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"authAlert": {
				"emailTemplate": {
					"body": " <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color: #f4f4f5;\">\n      <tr>\n        <td align=\"center\" style=\"padding: 48px 16px;\">\n\n          <table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width: 560px; background-color: #ffffff; border: 1px solid #e4e4e7;\">\n            <!-- Header -->\n            <tr>\n              <td style=\"padding: 28px 36px; border-bottom: 1px solid #e4e4e7;\">\n                <span style=\"font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: bold; color: #f59e0b; letter-spacing: 0.08em;\">{APP_NAME}</span>\n              </td>\n            </tr>\n\n            <!-- Body -->\n            <tr>\n              <td style=\"padding: 36px 36px 28px;\">\n                <p style=\"margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #09090b; line-height: 1.3;\">New login detected</p>\n                <p style=\"margin: 0 0 24px 0; font-size: 14px; color: #52525b; line-height: 1.7;\">We noticed a login to your {APP_NAME} admin dashboard from a new location.</p>\n\n                <!-- Alert info block -->\n                <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">\n                  <tr>\n                    <td style=\"background-color: #f4f4f5; border-left: 3px solid #f59e0b; padding: 14px 16px;\">\n                      <p style=\"margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #3f3f46; line-height: 1.6;\">{ALERT_INFO}</p>\n                    </td>\n                  </tr>\n                </table>\n\n                <!-- Warning -->\n                <p style=\"margin: 24px 0 0 0; font-size: 14px; color: #09090b; font-weight: 600; line-height: 1.6;\">If this wasn't you, change your password immediately to revoke access from all other locations.</p>\n                <p style=\"margin: 12px 0 0 0; font-size: 14px; color: #52525b; line-height: 1.7;\">If this was you, you can safely ignore this email.</p>\n              </td>\n            </tr>\n\n            <!-- Footer -->\n            <tr>\n              <td style=\"padding: 20px 36px 28px; border-top: 1px solid #e4e4e7;\">\n                <p style=\"margin: 0; font-size: 12px; color: #a1a1aa;\">— The {APP_NAME} team</p>\n              </td>\n            </tr>\n          </table>\n\n        </td>\n      </tr>\n    </table>"
				}
			}
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3142635823")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"authAlert": {
				"emailTemplate": {
					"body": "<p>Hello,</p>\n<p>We noticed a login to your {APP_NAME} account from a new location:</p>\n<p><em>{ALERT_INFO}</em></p>\n<p><strong>If this wasn't you, you should immediately change your {APP_NAME} account password to revoke access from all other locations.</strong></p>\n<p>If this was you, you may disregard this email.</p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>"
				}
			}
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
