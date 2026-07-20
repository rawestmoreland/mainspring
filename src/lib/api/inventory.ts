import pb from '#/lib/pocketbase';
import type {
  CreateCrystalSpecs,
  CreateInventory,
  CreateMainspringSpecs,
  CrystalSpecs,
  Inventory,
  MainspringSpecs,
} from '#/types';

const SPECS_EXPAND = 'mainspring_specs_via_inventory,crystal_specs_via_inventory';

export const InventoryApi = {
  getInventory: async (page: number = 1, limit: number = 100) => {
    const userId = pb.authStore.record?.id;
    if (!userId) return [];
    const inventory = await pb.collection('inventory').getList(page, limit, {
      filter: `user = "${userId}"`,
      expand: SPECS_EXPAND,
    });
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
    const inventory = await pb
      .collection('inventory')
      .getOne(id, { expand: SPECS_EXPAND });
    return inventory;
  },
  createMainspringSpecs: async (specs: CreateMainspringSpecs) => {
    const newSpecs = await pb.collection('mainspring_specs').create(specs);
    return newSpecs;
  },
  updateMainspringSpecs: async (id: string, specs: MainspringSpecs) => {
    const updatedSpecs = await pb
      .collection('mainspring_specs')
      .update(id, specs);
    return updatedSpecs;
  },
  createCrystalSpecs: async (specs: CreateCrystalSpecs) => {
    const newSpecs = await pb.collection('crystal_specs').create(specs);
    return newSpecs;
  },
  updateCrystalSpecs: async (id: string, specs: CrystalSpecs) => {
    const updatedSpecs = await pb
      .collection('crystal_specs')
      .update(id, specs);
    return updatedSpecs;
  },
};
