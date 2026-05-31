import pb from '#/lib/pocketbase';
import type { CreateTimegrapherReading, TimegrapherReading } from '#/types';

const COLLECTION = 'timegrapher_readings';

export const TimegrapherApi = {
  getReadingsByWatch: async (watchId: string): Promise<TimegrapherReading[]> => {
    const result = await pb.collection(COLLECTION).getList<TimegrapherReading>(1, 200, {
      filter: `watch = "${watchId}"`,
      sort: '-created',
    });
    return result.items;
  },

  createReading: async (data: CreateTimegrapherReading): Promise<TimegrapherReading> => {
    return pb.collection(COLLECTION).create<TimegrapherReading>(data);
  },

  deleteReading: async (id: string): Promise<void> => {
    await pb.collection(COLLECTION).delete(id);
  },

  patchAnalysis: async (id: string, ai_analysis: string): Promise<TimegrapherReading> => {
    return pb.collection(COLLECTION).update<TimegrapherReading>(id, { ai_analysis });
  },
};
