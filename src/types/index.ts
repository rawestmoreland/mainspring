export type WatchStage = 'before' | 'during' | 'after' | 'listing';
export type WatchStatus = 'sold' | 'in_progress' | 'listed' | 'acquired';
export type WatchCondition = 'worn' | 'parts_only' | 'good' | 'fair' | 'poor';
export type InventoryCategory = 'movement' | 'crystal' | 'strap' | 'tool' | 'gasket';

export type WatchPhoto = {
  id: number;
  stage: WatchStage;
  caption: string;
  url: string;
};

export type Watch = {
  id: number;
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
};

export type InventoryItem = {
  id: number;
  name: string;
  qty: number;
  unit_cost: number;
  category: InventoryCategory;
};

export type Equipment = {
  id: number;
  name: string;
  cost: number;
  date: string;
};
