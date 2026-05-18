import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DonorMovementsApi } from '#/lib/api/donorMovements';
import type { CreateDonorMovement, DonorMovement } from '#/types';
import { useAuth } from './auth';
import { useGoogleAnalytics } from 'tanstack-router-ga4';

export const useDonorMovements = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['donor_movements', { userId: user?.id }],
    queryFn: DonorMovementsApi.getAll,
    enabled: !!user,
  });
};

export const useCreateDonorMovement = () => {
  const queryClient = useQueryClient();
  const ga4 = useGoogleAnalytics();
  return useMutation({
    mutationFn: (data: CreateDonorMovement) => DonorMovementsApi.create(data),
    onSuccess: () => {
      // Log the event to Google Analytics
      ga4.event('donor_movement_added', {
        category: 'Donor Movement',
        label: 'Added a new donor movement',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['donor_movements'] });
    },
  });
};

export const useUpdateDonorMovement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DonorMovement> }) =>
      DonorMovementsApi.update(id, data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['donor_movements'] });
    },
  });
};
