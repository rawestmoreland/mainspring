import { createServerFn } from '@tanstack/react-start';
import PocketBase from 'pocketbase';
import { z } from 'zod';

const impersonateSchema = z.object({
  token: z.string(),
  targetUserId: z.string(),
});

export const impersonateUser = createServerFn()
  .inputValidator(impersonateSchema)
  .handler(async ({ data }): Promise<any> => {
    const pb = new PocketBase(process.env.VITE_PUBLIC_POCKETBASE_URL);

    // Hydrate the auth store with the caller's token
    pb.authStore.save(data.token);

    // Verify the token is still valid
    try {
      await pb.collection('users').authRefresh();
    } catch {
      throw new Error('Unauthorized');
    }

    // Check is_admin on their profile
    const profile = await pb
      .collection('user_profiles')
      .getFirstListItem(`user = "${pb.authStore.record?.id}"`);

    if (!profile.is_admin) {
      throw new Error('Forbidden');
    }

    // Now auth as superuser and impersonate...
    await pb
      .collection('_superusers')
      .authWithPassword(
        process.env.PB_SUPERUSER_EMAIL!,
        process.env.PB_SUPERUSER_PASSWORD!,
      );

    const impersonateClient = await pb
      .collection('users')
      .impersonate(data.targetUserId, 3600);

    return {
      token: impersonateClient.authStore.token,
      record: impersonateClient.authStore.record,
    };
  });
