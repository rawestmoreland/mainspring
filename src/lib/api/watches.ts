import pb from '#/lib/pocketbase';
import type { CreateWatch, Watch, WatchPhoto } from '#/types';

export const WatchesApi = {
  getWatches: async (
    page: number = 1,
    limit: number = 100,
  ): Promise<Watch[]> => {
    const watches = await pb
      .collection('watches')
      .getList<Watch>(page, limit, { expand: 'watch_photos_via_watch' });
    return watches.items.map((w) => ({
      ...w,
      photos:
        w.expand?.watch_photos_via_watch?.map((p: WatchPhoto) => ({
          id: p.id,
          stage: p.stage,
          caption: p.caption,
          image: `${import.meta.env.VITE_ASSET_URL}/${p.id}/${`thumbs_`}${p.image}/${`100x100_`}${p.image}`,
        })) ?? [],
    }));
  },
  createWatch: async (watch: CreateWatch): Promise<Watch> => {
    const newWatch = await pb.collection('watches').create<Watch>(watch as any);
    return newWatch;
  },
  updateWatch: async (id: string, watch: Watch): Promise<Watch> => {
    const updatedWatch = await pb
      .collection('watches')
      .update<Watch>(id, watch as any);
    return updatedWatch;
  },
  deleteWatch: async (id: string): Promise<void> => {
    await pb.collection('watches').delete(id);
  },
  deleteWatchPhoto: async (photoId: string): Promise<void> => {
    await pb.collection('watch_photos').delete(photoId);
  },
  getWatchById: async (id: string): Promise<Watch> => {
    const watch = await pb
      .collection('watches')
      .getOne<Watch>(id, { expand: 'watch_photos_via_watch ' });
    return {
      ...watch,
      photos:
        watch.expand?.watch_photos_via_watch?.map((p: WatchPhoto) => ({
          id: p.id,
          stage: p.stage,
          caption: p.caption,
          image: `${import.meta.env.VITE_ASSET_URL}/${p.id}/${p.image}`,
        })) ?? [],
    };
  },
};
