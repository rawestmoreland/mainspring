import { InventoryApi } from '#/lib/api/inventory';
import type { CreateInventory, Inventory } from '#/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => InventoryApi.getInventory(),
  });
};

export const useCreateInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inventory: CreateInventory) =>
      InventoryApi.createInventory(inventory),
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
    queryKey: ['inventory', id],
    queryFn: () => InventoryApi.getInventoryById(id),
    enabled: !!id,
  });
};
