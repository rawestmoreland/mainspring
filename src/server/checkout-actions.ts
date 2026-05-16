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
  .inputValidator(
    ({
      userId,
      pathname,
      gaClientId,
    }: {
      userId: string;
      pathname: string;
      gaClientId: string;
    }) => ({
      userId,
      pathname,
      gaClientId,
    }),
  )
  .handler(async ({ data: { userId, pathname, gaClientId } }) => {
    const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
    const variantId = process.env.PRODUCT_VARIANT_ID ?? '1622808';

    const appUrl = !!process.env.APP_URL
      ? `${process.env.APP_URL}`
      : 'http://localhost:3000';

    const { data, error } = await createCheckout(storeId, variantId, {
      productOptions: {
        redirectUrl: `${appUrl}${pathname}?checkout_success=true`,
      },
      checkoutData: {
        custom: {
          user_id: userId,
          ga_client_id: gaClientId,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.data.attributes.url;
  });
