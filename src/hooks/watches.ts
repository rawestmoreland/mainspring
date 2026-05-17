import { WatchesApi } from '#/lib/api/watches';
import { WatchStatus, type CreateWatch, type Watch } from '#/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useGoogleAnalytics } from 'tanstack-router-ga4';
import { useAuth } from './auth';

export const useWatches = () => {
  const { user } = useAuth();
  return useQuery<Watch[]>({
    queryKey: ['watches', { userId: user?.id }],
    queryFn: () => WatchesApi.getWatches(),
  });
};

export const useCreateWatch = () => {
  const ga4 = useGoogleAnalytics();

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ watch }: { watch: CreateWatch }) =>
      WatchesApi.createWatch(watch),
    onSuccess: () => {
      ga4.event('watch_added', {
        category: 'Watch',
        label: 'Created a new watch',
      });
    },
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
  const ga4 = useGoogleAnalytics();
  return useMutation({
    mutationFn: (watch: Watch) => {
      return WatchesApi.updateWatch(watch.id, watch);
    },
    onSuccess: (data) => {
      if (data.status === WatchStatus.SOLD) {
        ga4.event('watch_sold', {
          category: 'Watch',
          label: 'Watch status updated to Sold',
        });
      }
      ga4.event('watch_updated', {
        category: 'Watch',
        label: 'Updated watch details',
        userInfo: { watchId: data.id },
      });
    },
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

export const useUploadFeaturedImage = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => WatchesApi.uploadFeaturedImage(watchId, file),
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      queryClient.invalidateQueries({ queryKey: ['watches', { watchId }] });
    },
  });
};

export const useUploadWatchPhotos = (watchId: string) => {
  const queryClient = useQueryClient();
  const ga4 = useGoogleAnalytics();
  return useMutation({
    mutationFn: (photos: { file: File; stage: string; caption: string }[]) => {
      return WatchesApi.uploadWatchPhotoBatch(watchId, photos);
    },
    onSuccess: () => {
      ga4.event('watch_photos_uploaded', {
        category: 'Watch',
        label: 'Uploaded photos for watch',
      });
    },
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watches', { watchId }] });
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
      queryClient.invalidateQueries({ queryKey: ['watches', { watchId }] });
    },
  });
};

export const useGetWatchById = (id: string) => {
  return useQuery<Watch>({
    queryKey: ['watches', { watchId: id }],
    queryFn: () => WatchesApi.getWatchById(id),
  });
};
