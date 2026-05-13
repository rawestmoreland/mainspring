import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WishlistApi } from '#/lib/api/wishlist';
import type { CreateWishlistItem, WishlistItem } from '#/types';

export const useWishlist = () => {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: () => WishlistApi.getItems(),
  });
};

export const useCreateWishlistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWishlistItem) => WishlistApi.createItem(data),
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
