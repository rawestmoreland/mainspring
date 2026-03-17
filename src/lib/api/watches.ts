import pb from '#/lib/pocketbase';
import type { CreateWatch, Watch } from '#/types';

export const WatchesApi = {
  getWatches: async (page: number = 1, limit: number = 100): Promise<Watch[]> => {
    const watches = await pb.collection('watches').getList<Watch>(page, limit);
    return watches.items;
  },
  createWatch: async (watch: CreateWatch): Promise<Watch> => {
    const newWatch = await pb.collection('watches').create<Watch>(watch as any);
    return newWatch;
  },
  updateWatch: async (id: string, watch: Watch): Promise<Watch> => {
    const updatedWatch = await pb.collection('watches').update<Watch>(id, watch as any);
    return updatedWatch;
  },
  deleteWatch: async (id: string): Promise<void> => {
    await pb.collection('watches').delete(id);
  },
  getWatchById: async (id: string): Promise<Watch> => {
    const watch = await pb.collection('watches').getOne<Watch>(id);
    return watch;
  },
};
