import pb from '#/lib/pocketbase';
import type {
  CreateWatchPartsShoppingItem,
  WatchPartsShoppingItem,
} from '#/types';

const COLLECTION = 'watch_parts_shopping_list';

export const WatchPartsShoppingApi = {
  getItemsByWatch: async (watchId: string): Promise<WatchPartsShoppingItem[]> => {
    const result = await pb
      .collection(COLLECTION)
      .getList<WatchPartsShoppingItem>(1, 500, {
        filter: `watch = "${watchId}"`,
        sort: 'created',
      });
    return result.items;
  },

  createItem: async (
    data: CreateWatchPartsShoppingItem,
  ): Promise<WatchPartsShoppingItem> => {
    return pb.collection(COLLECTION).create<WatchPartsShoppingItem>(data);
  },

  updateItem: async (
    id: string,
    data: Partial<WatchPartsShoppingItem>,
  ): Promise<WatchPartsShoppingItem> => {
    return pb
      .collection(COLLECTION)
      .update<WatchPartsShoppingItem>(id, data);
  },

  deleteItem: async (id: string): Promise<void> => {
    await pb.collection(COLLECTION).delete(id);
  },
};
