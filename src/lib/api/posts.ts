import pb from '#/lib/pocketbase';
import type { CreateRepairPost, RepairPost } from '#/types';

const COLLECTION = 'repair_posts';

function toRepairPost(r: Record<string, unknown>): RepairPost {
  const images = (r.images as string[] | undefined) ?? [];
  return {
    id: r.id as string,
    watch: r.watch as string,
    title: r.title as string,
    body: r.body as string,
    session_date: r.session_date as string,
    created: r.created as string,
    updated: r.updated as string,
    images,
    imageUrls: images.map(
      (filename) => `${import.meta.env.VITE_ASSET_URL}/${r.id}/${filename}`,
    ),
  };
}

export const PostsApi = {
  getPostsByWatch: async (watchId: string): Promise<RepairPost[]> => {
    const result = await pb.collection(COLLECTION).getList(1, 200, {
      filter: `watch = "${watchId}"`,
      sort: '-session_date',
    });
    return result.items.map(toRepairPost);
  },

  getPostById: async (postId: string): Promise<RepairPost> => {
    const record = await pb.collection(COLLECTION).getOne(postId);
    return toRepairPost(record);
  },

  createPost: async (data: CreateRepairPost, images: File[]): Promise<RepairPost> => {
    const fd = new FormData();
    fd.append('watch', data.watch);
    fd.append('title', data.title);
    fd.append('body', data.body);
    fd.append('session_date', data.session_date);
    images.forEach((f) => fd.append('images', f));
    const record = await pb.collection(COLLECTION).create(fd);
    return toRepairPost(record);
  },

  updatePost: async (
    postId: string,
    data: Partial<CreateRepairPost>,
    newImages: File[],
  ): Promise<RepairPost> => {
    const fd = new FormData();
    if (data.title !== undefined) fd.append('title', data.title);
    if (data.body !== undefined) fd.append('body', data.body);
    if (data.session_date !== undefined) fd.append('session_date', data.session_date);
    newImages.forEach((f) => fd.append('images', f));
    const record = await pb.collection(COLLECTION).update(postId, fd);
    return toRepairPost(record);
  },

  deletePost: async (postId: string): Promise<void> => {
    await pb.collection(COLLECTION).delete(postId);
  },

  deleteImage: async (postId: string, filename: string): Promise<RepairPost> => {
    const record = await pb.collection(COLLECTION).update(postId, {
      'images-': [filename],
    });
    return toRepairPost(record);
  },
};
