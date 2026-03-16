import pb from '#/lib/pocketbase';
import type { CreateWatch, Watch } from '#/types';

export const WatchesApi = {
  getWatches: async (page: number = 1, limit: number = 100) => {
    const watches = await pb.collection('watches').getList(page, limit);
    return watches.items;
  },
  createWatch: async (watch: CreateWatch) => {
    const newWatch = await pb.collection('watches').create(watch);
    return newWatch;
  },
  updateWatch: async (id: string, watch: Watch) => {
    const updatedWatch = await pb.collection('watches').update(id, watch);
    return updatedWatch;
  },
  deleteWatch: async (id: string) => {
    const deletedWatch = await pb.collection('watches').delete(id);
    return deletedWatch;
  },
  getWatchById: async (id: string) => {
    const watch = await pb.collection('watches').getOne(id);
    return watch;
  },
};
