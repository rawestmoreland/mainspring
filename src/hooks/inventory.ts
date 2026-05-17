import { InventoryApi } from '#/lib/api/inventory';
import type { CreateInventoryItem, Inventory } from '#/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth';

export const useInventory = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['inventory', { userId: user?.id }],
    queryFn: () => InventoryApi.getInventory(),
  });
};

export const useCreateInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inventory }: { inventory: CreateInventoryItem }) => {
      return InventoryApi.createInventory(inventory);
    },
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inventory: Inventory) =>
      InventoryApi.updateInventory(inventory.id, inventory),
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useDeleteInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => InventoryApi.deleteInventory(id),
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useGetInventoryById = (id: string) => {
  return useQuery({
    queryKey: ['inventory', { inventoryId: id }],
    queryFn: () => InventoryApi.getInventoryById(id),
    enabled: !!id,
  });
};
