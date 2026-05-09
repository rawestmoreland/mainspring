import pb from '#/lib/pocketbase';
import type { CreatePartUsed, PartUsed } from '#/types';

export const PartsUsedApi = {
  createPartUsed: async (data: CreatePartUsed): Promise<PartUsed> => {
    return pb.collection('parts_used').create<PartUsed>(data);
  },
  deletePartUsed: async (id: string): Promise<void> => {
    await pb.collection('parts_used').delete(id);
  },
};
