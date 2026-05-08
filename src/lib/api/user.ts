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
  signup: async (email: string, password: string, displayName: string) => {
    await pb
      .collection('users')
      .create({ email, password, passwordConfirm: password });
    const auth = await pb.collection('users').authWithPassword(email, password);
    await pb.collection('user_profiles').create({
      user: auth.record.id,
      display_name: displayName,
    });
    return auth;
  },
  passwordReset: async (email: string) => {
    await pb.collection('users').requestPasswordReset(email);
  },
  logout: async () => {
    pb.authStore.clear();
  },
};
