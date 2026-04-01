import { WatchesApi } from '#/lib/api/watches';
import type { CreateWatch, Watch } from '#/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useWatches = () => {
  return useQuery<Watch[]>({
    queryKey: ['watches'],
    queryFn: () => WatchesApi.getWatches(),
  });
};

export const useCreateWatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (watch: CreateWatch) => WatchesApi.createWatch(watch),
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watches'] });
    },
  });
};

export const useUpdateWatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (watch: Watch) => WatchesApi.updateWatch(watch.id, watch),
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watches'] });
    },
  });
};

export const useDeleteWatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WatchesApi.deleteWatch(id),
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watches'] });
    },
  });
};

export const useUploadWatchPhotos = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photos: { file: File; stage: string; caption: string }[]) => {
      return WatchesApi.uploadWatchPhotoBatch(watchId, photos);
    },
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watches', watchId] });
    },
  });
};

export const useDeleteWatchPhoto = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => WatchesApi.deleteWatchPhoto(photoId),
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watches', watchId] });
    },
  });
};

export const useGetWatchById = (id: string) => {
  return useQuery<Watch>({
    queryKey: ['watches', id],
    queryFn: () => WatchesApi.getWatchById(id),
  });
};
