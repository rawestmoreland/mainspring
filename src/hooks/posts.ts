import { PostsApi } from '#/lib/api/posts';
import type { CreateRepairPost, RepairPost } from '#/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const postsKey = (watchId: string) => ['posts', watchId];
const postKey = (postId: string) => ['post', postId];

export const useGetPostsByWatch = (watchId: string) =>
  useQuery<RepairPost[]>({
    queryKey: postsKey(watchId),
    queryFn: () => PostsApi.getPostsByWatch(watchId),
    enabled: !!watchId,
  });

export const useGetPostById = (postId: string) =>
  useQuery<RepairPost>({
    queryKey: postKey(postId),
    queryFn: () => PostsApi.getPostById(postId),
    enabled: !!postId,
  });

export const useCreatePost = (watchId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, images }: { data: CreateRepairPost; images: File[] }) =>
      PostsApi.createPost(data, images),
    onError: console.error,
    onSettled: () => qc.invalidateQueries({ queryKey: postsKey(watchId) }),
  });
};

export const useUpdatePost = (watchId: string, postId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      newImages,
    }: {
      data: Partial<CreateRepairPost>;
      newImages: File[];
    }) => PostsApi.updatePost(postId, data, newImages),
    onError: console.error,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: postKey(postId) });
      qc.invalidateQueries({ queryKey: postsKey(watchId) });
    },
  });
};

export const useDeletePost = (watchId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PostsApi.deletePost(id),
    onError: console.error,
    onSettled: () => qc.invalidateQueries({ queryKey: postsKey(watchId) }),
  });
};

export const useDeletePostImage = (watchId: string, postId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (filename: string) => PostsApi.deleteImage(postId, filename),
    onError: console.error,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: postKey(postId) });
      qc.invalidateQueries({ queryKey: postsKey(watchId) });
    },
  });
};
