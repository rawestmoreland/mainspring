import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TimegrapherApi } from '#/lib/api/timegrapher';
import type { CreateTimegrapherReading } from '#/types';

export const useGetTimegrapherReadings = (watchId: string) => {
  return useQuery({
    queryKey: ['timegrapher', watchId],
    queryFn: () => TimegrapherApi.getReadingsByWatch(watchId),
    enabled: !!watchId,
  });
};

export const useCreateTimegrapherReading = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimegrapherReading) =>
      TimegrapherApi.createReading(data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['timegrapher', watchId] });
    },
  });
};

export const useDeleteTimegrapherReading = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TimegrapherApi.deleteReading(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['timegrapher', watchId] });
    },
  });
};
