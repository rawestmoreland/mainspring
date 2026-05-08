import pb from '#/lib/pocketbase';

const COLLECTION = 'waitlist';

export const WaitlistApi = {
  joinWaitlist: async (email: string) => {
    await pb.collection(COLLECTION).create({ email });
  },
};
