import { EquipmentApi } from '#/lib/api/equipment';
import type { CreateEquipment, Equipment } from '#/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import pb from '#/lib/pocketbase';

export const useEquipment = (page: number = 1, limit: number = 100) => {
  const pbUser = pb.authStore.record?.id;
  return useQuery({
    queryKey: ['equipment', page, limit, pbUser],
    queryFn: () => EquipmentApi.getEquipment(page, limit),
    enabled: !!pbUser,
  });
};

export const useCreateEquipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (equipment: CreateEquipment) => {
      const pbUser = pb.authStore.record?.id;
      if (!pbUser) throw new Error('Not logged in');
      return EquipmentApi.createEquipment({ ...equipment, user: pbUser });
    },
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
