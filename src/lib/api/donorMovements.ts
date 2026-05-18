import pb from '#/lib/pocketbase';
import type { CreateDonorMovement, DonorMovement } from '#/types';

export const DonorMovementsApi = {
  getAll: async (): Promise<DonorMovement[]> => {
    const userId = pb.authStore.record?.id;
    if (!userId) return [];
    const result = await pb
      .collection('donor_movements')
      .getList<DonorMovement>(1, 500, {
        filter: `user = "${userId}"`,
        sort: '-created',
      });
    return result.items;
  },

  create: async (data: CreateDonorMovement): Promise<DonorMovement> => {
    const result = await pb
      .collection('donor_movements')
      .create<DonorMovement>(data);
    return result;
  },

  update: async (
    id: string,
    data: Partial<DonorMovement>,
  ): Promise<DonorMovement> => {
    const result = await pb
      .collection('donor_movements')
      .update<DonorMovement>(id, data);
    return result;
  },
};
