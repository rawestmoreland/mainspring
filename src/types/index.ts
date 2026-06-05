export type WatchStage = 'before' | 'during' | 'after' | 'listing';
export const WatchStatus = {
  SOLD: 'sold',
  IN_PROGRESS: 'in_progress',
  LISTED: 'listed',
  ACQUIRED: 'acquired',
  PAUSED: 'paused',
  KEPT: 'kept',
} as const;
export type WatchStatus = (typeof WatchStatus)[keyof typeof WatchStatus];
export type WatchCondition = 'worn' | 'parts_only' | 'good' | 'fair' | 'poor';
export type MovementPart = {
  id: string;
  user: string;
  name: string;
};

export const InventoryCategory = {
  MOVEMENT: 'movement',
  HARVESTED_PART: 'harvested_part',
  MAINSPRING: 'mainspring',
  CRYSTAL: 'crystal',
  STRAP: 'strap',
  BRACELET: 'bracelet',
  CROWN: 'crown',
  GASKET: 'gasket',
  HAND: 'hand',
  DIAL: 'dial',
  BEZEL: 'bezel',
  CASE: 'case',
  TOOL: 'tool',
  OIL: 'oil',
  OTHER: 'other',
} as const;

export type InventoryCategory =
  (typeof InventoryCategory)[keyof typeof InventoryCategory];

export type WatchPhoto = {
  id: string;
  collectionId: string;
  stage: WatchStage;
  caption: string;
  image: string;
  created?: string;
  sort_order?: number;
};

export type PartUsed = {
  id: string;
  watch: string;
  inventory_item?: string;
  qty_used: number;
  date_used?: string;
  notes?: string;
  expand?: {
    inventory_item?: InventoryItem;
  };
};

export type Watch = {
  id: string;
  user: string;
  make: string;
  model: string;
  reference: string;
  year: number;
  status: WatchStatus;
  condition_bought: WatchCondition;
  bought_price: number;
  sold_price: number | null;
  parts_cost: number;
  hours_spent: number;
  bought_date: string;
  sold_date: string | null;
  notes: string;
  featured_image: string | null;
  featured_image_url?: string;
  is_frozen?: boolean;
  photos: WatchPhoto[];
  expand?: {
    watch_photos_via_watch?: WatchPhoto[];
    parts_used_via_watch?: PartUsed[];
  };
  updated: string;
};

export type CreateWatch = Omit<Watch, 'id' | 'photos' | 'updated'>;

export type InventoryItem = {
  id: string;
  name: string;
  user: string;
  qty: number;
  unit_cost: number;
  category: InventoryCategory;
  notes: string;
};

export type CreateInventoryItem = Omit<InventoryItem, 'id'>;

export type CreatePartUsed = {
  watch: string;
  inventory_item: string;
  qty_used: number;
  date_used?: string;
  notes?: string;
};

export type Equipment = {
  id: string;
  name: string;
  user: string;
  cost: number;
  date_acquired: string;
  supplier: string;
  notes: string;
};

export type CreateEquipment = Omit<Equipment, 'id'>;

export type DonorMovement = {
  id: string;
  user: string;
  caliber: string;
  manufacturer: string;
  jewels?: number;
  missing_parts?: string[];
  created: string;
  updated: string;
};

export type CreateDonorMovement = Omit<
  DonorMovement,
  'id' | 'created' | 'updated'
>;

export type Inventory = {
  id: string;
  user: string;
  name: string;
  qty: number;
  unit_cost: number;
  category: InventoryCategory;
  supplier?: string;
  notes?: string;
  is_donor?: boolean;
  missing_parts?: string[];
};

export type CreateInventory = Omit<Inventory, 'id'>;

export type UserProfile = {
  id: string;
  collectionId: string;
  user: string;
  subdomain: string;
  display_name: string;
  bio: string;
  is_public: boolean;
  is_admin: boolean;
  created: string;
  updated: string;
};

export type RepairPost = {
  id: string;
  user: string;
  watch?: string;
  title: string;
  body: string;
  session_date: string;
  images: string[];
  imageUrls: string[];
  created: string;
  updated: string;
};

export type CreateRepairPost = Omit<
  RepairPost,
  'id' | 'user' | 'images' | 'imageUrls' | 'created' | 'updated'
>;

export type TimegrapherStatus =
  | 'post_service'
  | 'pre_service'
  | 'incoming'
  | 'routine';

export type TimegrapherReading = {
  id: string;
  watch: string;
  status: TimegrapherStatus;
  lift_angle: number;
  notes?: string;
  du_rate?: number;
  du_amp?: number;
  du_be?: number;
  dd_rate?: number;
  dd_amp?: number;
  dd_be?: number;
  cu_rate?: number;
  cu_amp?: number;
  cu_be?: number;
  cd_rate?: number;
  cd_amp?: number;
  cd_be?: number;
  cl_rate?: number;
  cl_amp?: number;
  cl_be?: number;
  cr_rate?: number;
  cr_amp?: number;
  cr_be?: number;
  ai_analysis?: string;
  created: string;
  updated: string;
};

export type CreateTimegrapherReading = Omit<
  TimegrapherReading,
  'id' | 'created' | 'updated' | 'ai_analysis'
>;

export type PartsShoppingStatus = 'needed' | 'ordered' | 'in_hand';

export type WatchPartsShoppingItem = {
  id: string;
  user: string;
  watch: string;
  name: string;
  category?: InventoryCategory;
  target_price?: number;
  notes?: string;
  status: PartsShoppingStatus;
  created: string;
  updated: string;
};

export type CreateWatchPartsShoppingItem = Omit<
  WatchPartsShoppingItem,
  'id' | 'created' | 'updated'
>;

export type WishlistPriority = 'low' | 'medium' | 'high';
export type WishlistStatus = 'wanted' | 'watching' | 'acquired';

export type WishlistItem = {
  id: string;
  user: string;
  make: string;
  model: string;
  reference?: string;
  target_price?: number;
  notes?: string;
  priority: WishlistPriority;
  status: WishlistStatus;
  created: string;
  updated: string;
};

export type CreateWishlistItem = Omit<
  WishlistItem,
  'id' | 'created' | 'updated'
>;

export type Subscription = {
  id: string;
  user: string;
  subscription_id?: string;
  subscription_status?: SubscriptionStatus;
  renews_at?: string;
  ends_at?: string;
  lemon_squeezy_customer_id?: string;
};

export const SubscriptionStatus = {
  FREE: 'free',
  ON_TRIAL: 'on_trial',
  PAUSED: 'paused',
  PAST_DUE: 'past_due',
  UNPAID: 'unpaid',
  CANCELLED: 'cancelled',
  ACTIVE: 'active',
  PAID: 'paid',
  EXPIRED: 'expired',
} as const;

export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export type WorkSessionStatus = 'running' | 'paused' | 'completed';

export type WorkSession = {
  id: string;
  user: string;
  watch: string;
  label: string;
  started_at: string;
  total_elapsed_seconds: number;
  status: WorkSessionStatus;
  ended_at: string | null;
  final_duration_seconds: number | null;
  created: string;
};
