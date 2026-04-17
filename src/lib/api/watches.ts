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
          collectionId: p.collectionId,
          stage: p.stage,
          caption: p.caption,
          image: `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${p.collectionId}/${p.id}/${p.image}?thumb=100x100`,
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
  uploadWatchPhoto: async (
    watchId: string,
    file: File,
    stage: string,
    caption: string,
  ): Promise<void> => {
    const fd = new FormData();
    fd.append('watch', watchId);
    fd.append('stage', stage);
    fd.append('caption', caption);
    fd.append('image', file);
    await pb.collection('watch_photos').create(fd);
  },
  uploadWatchPhotoBatch: async (
    watchId: string,
    photos: { file: File; stage: string; caption: string }[],
  ): Promise<void> => {
    const batch = pb.createBatch();
    photos.forEach((p) => {
      const fd = new FormData();
      fd.append('watch', watchId);
      fd.append('stage', p.stage);
      fd.append('caption', p.caption);
      fd.append('image', p.file);
      batch.collection('watch_photos').create({
        watch: watchId,
        stage: p.stage,
        caption: p.caption,
        image: p.file,
      });
    });
    await batch.send();
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
          collectionId: p.collectionId,
          stage: p.stage,
          caption: p.caption,
          image: `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${p.collectionId}/${p.id}/${p.image}?thumb=150x150`,
        })) ?? [],
    };
  },
};
