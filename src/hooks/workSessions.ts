import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WorkSessionsApi } from '#/lib/api/workSessions';
import type { WorkSession } from '#/types';

const activeKey = (watchId: string) => ['work_sessions', 'active', watchId];
const completedKey = (watchId: string) => ['work_sessions', watchId];

export const useActiveWorkSession = (watchId: string) => {
  return useQuery<WorkSession | null>({
    queryKey: activeKey(watchId),
    queryFn: () => WorkSessionsApi.getActiveSession(watchId),
  });
};

export const useCompletedWorkSessions = (watchId: string) => {
  return useQuery<WorkSession[]>({
    queryKey: completedKey(watchId),
    queryFn: () => WorkSessionsApi.getCompletedSessions(watchId),
  });
};

export const useCreateWorkSession = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label?: string) => WorkSessionsApi.createSession(watchId, label),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: activeKey(watchId) });
    },
  });
};

export const usePauseWorkSession = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, totalElapsed }: { id: string; totalElapsed: number }) =>
      WorkSessionsApi.pauseSession(id, totalElapsed),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: activeKey(watchId) });
    },
  });
};

export const useResumeWorkSession = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WorkSessionsApi.resumeSession(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: activeKey(watchId) });
    },
  });
};

export const useStopWorkSession = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, finalDuration }: { id: string; finalDuration: number }) =>
      WorkSessionsApi.stopSession(id, finalDuration),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: activeKey(watchId) });
      queryClient.invalidateQueries({ queryKey: completedKey(watchId) });
    },
  });
};

export const useUpdateWorkSession = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      label,
      finalDurationSeconds,
    }: {
      id: string;
      label: string;
      finalDurationSeconds: number;
    }) => WorkSessionsApi.updateSession(id, label, finalDurationSeconds),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: completedKey(watchId) });
    },
  });
};

export const useCreateManualWorkSession = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      startedAt,
      endedAt,
      label,
    }: {
      startedAt: Date;
      endedAt: Date;
      label?: string;
    }) => WorkSessionsApi.createManualSession(watchId, startedAt, endedAt, label),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: completedKey(watchId) });
    },
  });
};

export const useDeleteWorkSession = (watchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WorkSessionsApi.deleteSession(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: completedKey(watchId) });
    },
  });
};
