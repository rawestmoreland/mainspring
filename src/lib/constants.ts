export const FREE_PROJECT_LIMIT = 2;

export const MOVEMENT_PARTS: { value: string; label: string }[] = [
  { value: 'mainspring', label: 'Mainspring' },
  { value: 'barrel', label: 'Barrel' },
  { value: 'balance_wheel', label: 'Balance Wheel' },
  { value: 'balance_staff', label: 'Balance Staff' },
  { value: 'hairspring', label: 'Hairspring' },
  { value: 'pallet_fork', label: 'Pallet Fork' },
  { value: 'escape_wheel', label: 'Escape Wheel' },
  { value: 'center_wheel', label: 'Center Wheel' },
  { value: 'third_wheel', label: 'Third Wheel' },
  { value: 'fourth_wheel', label: 'Fourth Wheel' },
  { value: 'cannon_pinion', label: 'Cannon Pinion' },
  { value: 'minute_wheel', label: 'Minute Wheel' },
  { value: 'hour_wheel', label: 'Hour Wheel' },
  { value: 'ratchet_wheel', label: 'Ratchet Wheel' },
  { value: 'click_spring', label: 'Click Spring' },
  { value: 'setting_lever', label: 'Setting Lever' },
  { value: 'stem', label: 'Stem' },
  { value: 'date_wheel', label: 'Date Wheel' },
  { value: 'rotor', label: 'Rotor (auto)' },
];
export const FREE_PHOTO_LIMIT = 3;

export const NAV_PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈', path: '/dashboard' },
  { id: 'watches', label: 'Watches', icon: '◷', path: '/watches' },
  { id: 'inventory', label: 'Inventory', icon: '⊡', path: '/inventory' },
  { id: 'equipment', label: 'Equipment', icon: '⚙', path: '/equipment' },
  { id: 'wishlist', label: 'Wishlist', icon: '♡', path: '/wishlist' },
] as const;

export type PageId = (typeof NAV_PAGES)[number]['id'];
