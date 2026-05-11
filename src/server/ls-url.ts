import { createServerFn } from '@tanstack/react-start';
import {
  getCustomer,
  getSubscription,
  lemonSqueezySetup,
} from '@lemonsqueezy/lemonsqueezy.js';

// This runs on the server when this module is imported
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error('Lemon Squeezy Error:', error),
});

export const getSignedUrl = createServerFn({
  method: 'GET',
})
  .inputValidator((subscriptionId: string) => subscriptionId)
  .handler(async ({ data: subscriptionId }) => {
    const { data, error } = await getSubscription(subscriptionId);

    if (error) {
      throw new Error(error.message);
    }

    return data.data.attributes.urls.customer_portal;
  });

export const getCustomerPortalUrl = createServerFn({
  method: 'GET',
})
  .inputValidator((customerId: string) => customerId)
  .handler(async ({ data: customerId }) => {
    const { data, error } = await getCustomer(customerId);

    if (error) {
      throw new Error(error.message);
    }

    return data.data.attributes.urls.customer_portal;
  });
