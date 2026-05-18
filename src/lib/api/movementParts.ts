import pb from '#/lib/pocketbase';

export type MovementPartRecord = {
  id: string;
  user: string;
  name: string;
};

export const MovementPartsApi = {
  getAll: async (): Promise<MovementPartRecord[]> => {
    const userId = pb.authStore.record?.id;
    if (!userId) return [];
    const result = await pb.collection('movement_parts').getList(1, 500, {
      filter: `user = "${userId}"`,
      sort: 'name',
    });
    return result.items as unknown as MovementPartRecord[];
  },

  create: async (name: string): Promise<MovementPartRecord> => {
    const userId = pb.authStore.record?.id;
    if (!userId) throw new Error('Not authenticated');
    const result = await pb.collection('movement_parts').create({ user: userId, name });
    return result as unknown as MovementPartRecord;
  },

};
