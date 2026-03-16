import { EquipmentApi } from '#/lib/api/equipment';
import type { CreateEquipment, Equipment } from '#/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useEquipment = (page: number = 1, limit: number = 100) => {
  return useQuery({
    queryKey: ['equipment', page, limit],
    queryFn: () => EquipmentApi.getEquipment(page, limit),
  });
};

export const useCreateEquipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (equipment: CreateEquipment) =>
      EquipmentApi.createEquipment(equipment),
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
};

export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (equipment: Equipment) =>
      EquipmentApi.updateEquipment(equipment.id, equipment),
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
};

export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => EquipmentApi.deleteEquipment(id),
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
};

export const useGetEquipmentById = (id: string) => {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: () => EquipmentApi.getEquipmentById(id),
  });
};
