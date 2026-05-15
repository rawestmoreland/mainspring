export const FREE_PROJECT_LIMIT = 2;
export const FREE_PHOTO_LIMIT = 3;

export const NAV_PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈', path: '/dashboard' },
  { id: 'watches', label: 'Watches', icon: '◷', path: '/watches' },
  { id: 'inventory', label: 'Inventory', icon: '⊡', path: '/inventory' },
  { id: 'equipment', label: 'Equipment', icon: '⚙', path: '/equipment' },
  { id: 'wishlist', label: 'Wishlist', icon: '♡', path: '/wishlist' },
] as const;

export type PageId = (typeof NAV_PAGES)[number]['id'];
