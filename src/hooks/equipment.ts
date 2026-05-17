import { EquipmentApi } from '#/lib/api/equipment';
import type { CreateEquipment, Equipment } from '#/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth';
import { useGoogleAnalytics } from 'tanstack-router-ga4';

export const useEquipment = (page: number = 1, limit: number = 100) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['equipment', { userId: user?.id }, page, limit],
    queryFn: () => EquipmentApi.getEquipment(page, limit),
  });
};

export const useCreateEquipment = () => {
  const queryClient = useQueryClient();
  const ga4 = useGoogleAnalytics();
  return useMutation({
    mutationFn: ({ equipment }: { equipment: CreateEquipment }) => {
      return EquipmentApi.createEquipment(equipment);
    },
    onSuccess: () => {
      ga4.event('equipment_added', {
        category: 'Equipment',
        label: 'Added a new equipment item',
      });
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
    queryKey: ['equipment', { equipmentId: id }],
    queryFn: () => EquipmentApi.getEquipmentById(id),
  });
};
