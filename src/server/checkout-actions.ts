import { createServerFn } from '@tanstack/react-start';
import {
  createCheckout,
  lemonSqueezySetup,
} from '@lemonsqueezy/lemonsqueezy.js';

// This runs on the server when this module is imported
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error('Lemon Squeezy Error:', error),
});

export const startProCheckout = createServerFn({
  method: 'POST',
})
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
    const variantId = '1622808';

    const appUrl = !!process.env.APP_URL
      ? `${process.env.APP_URL}?checkout_success=true`
      : 'http://localhost:3000?checkout_success=true';

    const { data, error } = await createCheckout(storeId, variantId, {
      productOptions: {
        redirectUrl: `${appUrl}/dashboard`,
      },
      checkoutData: {
        custom: {
          user_id: userId,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.data.attributes.url;
  });
