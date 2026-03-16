export type Watch = {
  id: number;
  make: string;
  model: string;
  reference: string;
  year: number;
  status: string;
  condition_bought: string;
  bought_price: number;
  sold_price: number | null;
  parts_cost: number;
  hours_spent: number;
};
