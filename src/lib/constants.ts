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

export const NAV_PAGES: Array<{
  id: string;
  label: string;
  icon: string;
  path: string;
}> = [
  { id: 'dashboard', label: 'navDashboard', icon: '◈', path: '/dashboard' },
  { id: 'watches', label: 'navWatches', icon: '◷', path: '/watches' },
  { id: 'inventory', label: 'navInventory', icon: '⊡', path: '/inventory' },
  { id: 'equipment', label: 'navEquipment', icon: '⚙', path: '/equipment' },
  { id: 'wishlist', label: 'navWishlist', icon: '♡', path: '/wishlist' },
] as const;

export type PageId = (typeof NAV_PAGES)[number]['id'];

export enum LocalStorageKeys {
  InventoryFilterKey = 'hairspring-inventoryFilterQty',
  InventoryViewModeKey = 'hairspring-viewMode',
}

export enum FeatureFlags {
  TimegrapherAIAnalysis = 'timegrapher-ai-analysis',
}

export const currencies = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimal_digits: 2,
    countries: ['United States', 'Ecuador', 'El Salvador'],
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimal_digits: 2,
    countries: ['Germany', 'France', 'Italy', 'Spain', 'Netherlands'],
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimal_digits: 2,
    countries: ['United Kingdom'],
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimal_digits: 0,
    countries: ['Japan'],
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    decimal_digits: 2,
    countries: ['Switzerland', 'Liechtenstein'],
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    decimal_digits: 2,
    countries: ['Australia'],
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    decimal_digits: 2,
    countries: ['Canada'],
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    decimal_digits: 2,
    countries: ['China'],
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    decimal_digits: 2,
    countries: ['India'],
  },
  {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    decimal_digits: 2,
    countries: ['Mexico'],
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    decimal_digits: 2,
    countries: ['Brazil'],
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    decimal_digits: 0,
    countries: ['South Korea'],
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    decimal_digits: 2,
    countries: ['Singapore'],
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    decimal_digits: 2,
    countries: ['Hong Kong'],
  },
  {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    decimal_digits: 2,
    countries: ['Norway'],
  },
  {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    decimal_digits: 2,
    countries: ['Sweden'],
  },
  {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    decimal_digits: 2,
    countries: ['Denmark'],
  },
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    decimal_digits: 2,
    countries: ['New Zealand'],
  },
  {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    decimal_digits: 2,
    countries: ['South Africa'],
  },
  {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    decimal_digits: 2,
    countries: ['Russia'],
  },
  {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    decimal_digits: 2,
    countries: ['Turkey'],
  },
  {
    code: 'PLN',
    name: 'Polish Zloty',
    symbol: 'zł',
    decimal_digits: 2,
    countries: ['Poland'],
  },
  {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    decimal_digits: 2,
    countries: ['Thailand'],
  },
  {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    decimal_digits: 0,
    countries: ['Indonesia'],
  },
  {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    decimal_digits: 2,
    countries: ['Malaysia'],
  },
  {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    decimal_digits: 2,
    countries: ['Philippines'],
  },
  {
    code: 'CZK',
    name: 'Czech Koruna',
    symbol: 'Kč',
    decimal_digits: 2,
    countries: ['Czech Republic'],
  },
  {
    code: 'ILS',
    name: 'Israeli Shekel',
    symbol: '₪',
    decimal_digits: 2,
    countries: ['Israel'],
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    decimal_digits: 2,
    countries: ['United Arab Emirates'],
  },
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: '﷼',
    decimal_digits: 2,
    countries: ['Saudi Arabia'],
  },
];
