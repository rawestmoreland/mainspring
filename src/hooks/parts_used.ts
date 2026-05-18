import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PartsUsedApi } from '#/lib/api/parts_used';
import type { CreatePartUsed } from '#/types';

export const useCreatePartUsed = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CreatePartUsed, 'watch'>) =>
      PartsUsedApi.createPartUsed({ ...data, watch: watchId }),
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watches', { watchId }] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useDeletePartUsed = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PartsUsedApi.deletePartUsed(id),
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watches', { watchId }] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};
