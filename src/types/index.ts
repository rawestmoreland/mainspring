export type WatchStage = 'before' | 'during' | 'after' | 'listing';
export type WatchStatus = 'sold' | 'in_progress' | 'listed' | 'acquired';
export type WatchCondition = 'worn' | 'parts_only' | 'good' | 'fair' | 'poor';
export type InventoryCategory =
  | 'movement'
  | 'crystal'
  | 'strap'
  | 'tool'
  | 'gasket';

export type WatchPhoto = {
  id: string;
  stage: WatchStage;
  caption: string;
  image: string;
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
  };
};

export type CreateWatch = Omit<Watch, 'id' | 'photos'>;

export type InventoryItem = {
  id: string;
  name: string;
  qty: number;
  unit_cost: number;
  category: InventoryCategory;
};

export type CreateInventoryItem = Omit<InventoryItem, 'id'>;

export type Equipment = {
  id: string;
  name: string;
  cost: number;
  date: string;
};

export type CreateEquipment = Omit<Equipment, 'id'>;

export type Inventory = {
  id: string;
  name: string;
  qty: number;
  unit_cost: number;
  category: InventoryCategory;
};

export type CreateInventory = Omit<Inventory, 'id'>;
