export const HOURLY_RATE = 25;
export const GOAL = 8500;
export const GOAL_LABEL = 'Rolex Sub 5513';

export const NAV_PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈', path: '/' },
  { id: 'watches',   label: 'Watches',   icon: '◷', path: '/watches' },
  { id: 'inventory', label: 'Inventory', icon: '⊡', path: '/inventory' },
  { id: 'equipment', label: 'Equipment', icon: '⚙', path: '/equipment' },
] as const;

export type PageId = (typeof NAV_PAGES)[number]['id'];
