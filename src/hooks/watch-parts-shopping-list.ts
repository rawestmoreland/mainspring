import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WatchPartsShoppingApi } from '#/lib/api/watch-parts-shopping-list';
import type {
  CreateWatchPartsShoppingItem,
  WatchPartsShoppingItem,
} from '#/types';

export const useGetPartsShoppingList = (watchId: string) => {
  return useQuery({
    queryKey: ['parts_shopping', watchId],
    queryFn: () => WatchPartsShoppingApi.getItemsByWatch(watchId),
    enabled: !!watchId,
  });
};

export const useCreatePartsShoppingItem = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWatchPartsShoppingItem) =>
      WatchPartsShoppingApi.createItem(data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parts_shopping', watchId] });
    },
  });
};

export const useUpdatePartsShoppingItem = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WatchPartsShoppingItem> }) =>
      WatchPartsShoppingApi.updateItem(id, data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parts_shopping', watchId] });
    },
  });
};

export const useDeletePartsShoppingItem = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WatchPartsShoppingApi.deleteItem(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parts_shopping', watchId] });
    },
  });
};
