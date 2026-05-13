import pb from '#/lib/pocketbase';
import type { CreateWishlistItem, WishlistItem } from '#/types';

const COLLECTION = 'watch_wishlist';

export const WishlistApi = {
  getItems: async (): Promise<WishlistItem[]> => {
    const userId = pb.authStore.record?.id;
    const result = await pb
      .collection(COLLECTION)
      .getList<WishlistItem>(1, 500, {
        filter: `user = "${userId}"`,
        sort: '-created',
      });
    return result.items;
  },

  createItem: async (data: CreateWishlistItem): Promise<WishlistItem> => {
    return pb.collection(COLLECTION).create<WishlistItem>(data);
  },

  updateItem: async (
    id: string,
    data: Partial<WishlistItem>,
  ): Promise<WishlistItem> => {
    return pb.collection(COLLECTION).update<WishlistItem>(id, data);
  },

  deleteItem: async (id: string): Promise<void> => {
    await pb.collection(COLLECTION).delete(id);
  },
};
