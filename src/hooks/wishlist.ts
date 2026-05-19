import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WishlistApi } from '#/lib/api/wishlist';
import type { CreateWishlistItem, WishlistItem } from '#/types';
import { useAuth } from './auth';
import { usePostHog } from '@posthog/react';
import { useGoogleAnalytics } from 'tanstack-router-ga4';

export const useWishlist = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['wishlist', { userId: user?.id }],
    queryFn: () => WishlistApi.getItems(),
  });
};

export const useCreateWishlistItem = () => {
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const ga4 = useGoogleAnalytics();
  return useMutation({
    mutationFn: (data: CreateWishlistItem) => WishlistApi.createItem(data),
    onSuccess: () => {
      posthog.capture('wishlist_item_added', {
        category: 'Wishlist',
        label: 'Added a new item to the wishlist',
      });
      ga4.event('wishlist_item_added', {
        category: 'Wishlist',
        label: 'Added a new item to the wishlist',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};

export const useUpdateWishlistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WishlistItem> }) =>
      WishlistApi.updateItem(id, data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};

export const useDeleteWishlistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WishlistApi.deleteItem(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};
