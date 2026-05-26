import pb from '#/lib/pocketbase';
import type { WorkSession, WorkSessionStatus } from '#/types';

export const WorkSessionsApi = {
  getActiveSession: async (watchId: string): Promise<WorkSession | null> => {
    const userId = pb.authStore.record?.id;
    if (!userId) return null;
    const result = await pb
      .collection('work_sessions')
      .getList<WorkSession>(1, 1, {
        filter: `watch = "${watchId}" && user = "${userId}" && status != "completed"`,
        sort: '-created',
        requestKey: null,
      });
    return result.items[0] ?? null;
  },

  getCompletedSessions: async (watchId: string): Promise<WorkSession[]> => {
    const userId = pb.authStore.record?.id;
    if (!userId) return [];
    const result = await pb
      .collection('work_sessions')
      .getList<WorkSession>(1, 100, {
        filter: `watch = "${watchId}" && user = "${userId}" && status = "completed"`,
        sort: '-ended_at',
        requestKey: null,
      });
    return result.items;
  },

  createSession: async (
    watchId: string,
    label?: string,
  ): Promise<WorkSession> => {
    const userId = pb.authStore.record?.id;
    return pb.collection('work_sessions').create<WorkSession>({
      user: userId,
      watch: watchId,
      label: label ?? '',
      started_at: new Date().toISOString(),
      total_elapsed_seconds: 0,
      status: 'running' satisfies WorkSessionStatus,
      ended_at: null,
      final_duration_seconds: null,
    });
  },

  pauseSession: async (
    id: string,
    totalElapsed: number,
  ): Promise<WorkSession> => {
    return pb.collection('work_sessions').update<WorkSession>(id, {
      total_elapsed_seconds: totalElapsed,
      status: 'paused' satisfies WorkSessionStatus,
    });
  },

  resumeSession: async (id: string): Promise<WorkSession> => {
    return pb.collection('work_sessions').update<WorkSession>(id, {
      started_at: new Date().toISOString(),
      status: 'running' satisfies WorkSessionStatus,
    });
  },

  stopSession: async (
    id: string,
    finalDuration: number,
  ): Promise<WorkSession> => {
    return pb.collection('work_sessions').update<WorkSession>(id, {
      status: 'completed' satisfies WorkSessionStatus,
      final_duration_seconds: finalDuration,
      ended_at: new Date().toISOString(),
    });
  },

  updateSession: async (
    id: string,
    label: string,
    finalDurationSeconds: number,
  ): Promise<WorkSession> => {
    return pb.collection('work_sessions').update<WorkSession>(id, {
      label,
      final_duration_seconds: finalDurationSeconds,
    });
  },

  createManualSession: async (
    watchId: string,
    startedAt: Date,
    endedAt: Date,
    label?: string,
  ): Promise<WorkSession> => {
    const userId = pb.authStore.record?.id;
    const finalDurationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
    return pb.collection('work_sessions').create<WorkSession>({
      user: userId,
      watch: watchId,
      label: label ?? '',
      started_at: startedAt.toISOString(),
      total_elapsed_seconds: finalDurationSeconds,
      status: 'completed' satisfies WorkSessionStatus,
      ended_at: endedAt.toISOString(),
      final_duration_seconds: finalDurationSeconds,
    });
  },

  deleteSession: async (id: string): Promise<void> => {
    await pb.collection('work_sessions').delete(id);
  },
};
