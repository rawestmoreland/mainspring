package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("_pb_users_auth_")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"resetPasswordTemplate": {
				"body": "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color: #f4f4f5;\">\n      <tr>\n        <td align=\"center\" style=\"padding: 48px 16px;\">\n\n          <table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width: 560px; background-color: #ffffff; border: 1px solid #e4e4e7;\">\n            <!-- Header -->\n            <tr>\n              <td style=\"padding: 28px 36px; border-bottom: 1px solid #e4e4e7;\">\n                <span style=\"font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: bold; color: #f59e0b; letter-spacing: 0.08em;\">{APP_NAME}</span>\n              </td>\n            </tr>\n\n            <!-- Body -->\n            <tr>\n              <td style=\"padding: 36px 36px 28px;\">\n                <p style=\"margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #09090b; line-height: 1.3;\">Reset your password</p>\n                <p style=\"margin: 0 0 28px 0; font-size: 14px; color: #52525b; line-height: 1.7;\">We received a request to reset the password on your account. Click the button below to set a new password. This link expires in 24 hours.</p>\n\n                <!-- CTA Button -->\n                <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\">\n                  <tr>\n                    <td style=\"background-color: #f59e0b;\" align=\"center\">\n                      <a\n                        href=\"{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}\"\n                        target=\"_blank\"\n                        rel=\"noopener\"\n                        style=\"display: inline-block; padding: 12px 32px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #09090b; text-decoration: none; letter-spacing: 0.02em;\"\n                      >Reset Password</a>\n                    </td>\n                  </tr>\n                </table>\n\n                <!-- Fallback link -->\n                <p style=\"margin: 24px 0 4px 0; font-size: 12px; color: #71717a; line-height: 1.5;\">If the button doesn't work, copy this link into your browser:</p>\n                <p style=\"margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #a1a1aa; word-break: break-all;\">{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}</p>\n              </td>\n            </tr>\n\n            <!-- Footer -->\n            <tr>\n              <td style=\"padding: 20px 36px 28px; border-top: 1px solid #e4e4e7;\">\n                <p style=\"margin: 0 0 12px 0; font-size: 12px; color: #71717a; line-height: 1.6;\">If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</p>\n                <p style=\"margin: 0; font-size: 12px; color: #a1a1aa;\">— The {APP_NAME} team</p>\n              </td>\n            </tr>\n          </table>\n\n        </td>\n      </tr>\n    </table>"
			}
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("_pb_users_auth_")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"resetPasswordTemplate": {
				"body": "<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Reset password</a>\n</p>\n<p><i>If you didn't ask to reset your password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>"
			}
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
