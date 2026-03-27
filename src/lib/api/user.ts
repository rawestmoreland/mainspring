import pb from '#/lib/pocketbase';

export const UserApi = {
  getUser: async () => {
    const user = pb.authStore.record;
    return user;
  },
  login: async (email: string, password: string) => {
    const user = await pb.collection('users').authWithPassword(email, password);
    return user;
  },
  logout: async () => {
    pb.authStore.clear();
  },
};
