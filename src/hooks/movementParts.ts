import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MovementPartsApi } from '#/lib/api/movementParts';
import { MOVEMENT_PARTS } from '#/lib/constants';
import { useAuth } from './auth';

export const useMovementParts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['movement_parts', { userId: user?.id }],
    queryFn: MovementPartsApi.getAll,
    enabled: !!user,
  });
};

export const useCreateMovementPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => MovementPartsApi.create(name),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['movement_parts'] });
    },
  });
};

export const usePartVocabulary = (): string[] => {
  const { data: userParts = [] } = useMovementParts();
  const defaults = MOVEMENT_PARTS.map((p) => p.label);
  const defaultsLower = new Set(defaults.map((s) => s.toLowerCase()));
  const additions = userParts
    .map((p) => p.name)
    .filter((n) => !defaultsLower.has(n.toLowerCase()));
  return [...defaults, ...additions].sort((a, b) => a.localeCompare(b));
};
