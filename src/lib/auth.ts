import { redirect } from '@tanstack/react-router';

export async function requireAuth() {
  if (typeof window === 'undefined') return;
  const { default: pb } = await import('#/lib/pocketbase');
  if (!pb.authStore.isValid) {
    throw redirect({ to: '/login' });
  }
}
