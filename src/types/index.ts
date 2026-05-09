export type WatchStage = 'before' | 'during' | 'after' | 'listing';
export type WatchStatus =
  | 'sold'
  | 'in_progress'
  | 'listed'
  | 'acquired'
  | 'paused';
export type WatchCondition = 'worn' | 'parts_only' | 'good' | 'fair' | 'poor';
export type InventoryCategory =
  | 'movement'
  | 'crystal'
  | 'strap'
  | 'bracelet'
  | 'crown'
  | 'gasket'
  | 'hand'
  | 'dial'
  | 'bezel'
  | 'case'
  | 'tool'
  | 'oil'
  | 'other';

export type WatchPhoto = {
  id: string;
  collectionId: string;
  stage: WatchStage;
  caption: string;
  image: string;
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
  photos: WatchPhoto[];
  expand?: {
    watch_photos_via_watch?: WatchPhoto[];
    parts_used_via_watch?: PartUsed[];
  };
};

export type CreateWatch = Omit<Watch, 'id' | 'photos'>;

export type InventoryItem = {
  id: string;
  name: string;
  qty: number;
  unit_cost: number;
  category: InventoryCategory;
  notes: string;
};

export type CreateInventoryItem = Omit<InventoryItem, 'id'>;

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

export type Inventory = {
  id: string;
  user: string;
  name: string;
  qty: number;
  unit_cost: number;
  category: InventoryCategory;
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
