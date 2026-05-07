import type { UserProfile } from '#/types';

const POCKETBASE_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_POCKETBASE_URL
    ? import.meta.env.VITE_POCKETBASE_URL
    : 'http://127.0.0.1:8080';

/**
 * Resolves the tenant (UserProfile) from a host string such as "richard.hairspring.app".
 * Returns null on the main domain or when the subdomain is unknown/not public.
 *
 * Uses fetch() directly so it works in both server (Cloudflare Worker) and
 * client (browser) environments without the PocketBase SDK's localStorage dep.
 */
export async function resolveTenant(host: string): Promise<UserProfile | null> {
  const parts = host.split('.');
  if (parts.length !== 3 || parts[0] === 'www') return null;
  const subdomain = parts[0];

  try {
    const url = new URL(
      `/api/collections/user_profiles/records?filter=subdomain%3D%22${encodeURIComponent(subdomain)}%22%26%26is_public%3Dtrue&perPage=1`,
      POCKETBASE_URL,
    );
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: UserProfile[] };
    return data.items?.[0] ?? null;
  } catch {
    return null;
  }
}
