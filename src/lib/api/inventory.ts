import pb from '#/lib/pocketbase';
import type { CreateInventory, Inventory } from '#/types';

export const InventoryApi = {
  getInventory: async (page: number = 1, limit: number = 100) => {
    const inventory = await pb.collection('inventory').getList(page, limit);
    return inventory.items;
  },
  createInventory: async (inventory: CreateInventory) => {
    const newInventory = await pb.collection('inventory').create(inventory);
    return newInventory;
  },
  updateInventory: async (id: string, inventory: Inventory) => {
    const updatedInventory = await pb
      .collection('inventory')
      .update(id, inventory);
    return updatedInventory;
  },
  deleteInventory: async (id: string) => {
    const deletedInventory = await pb.collection('inventory').delete(id);
    return deletedInventory;
  },
  getInventoryById: async (id: string) => {
    const inventory = await pb.collection('inventory').getOne(id);
    return inventory;
  },
};
