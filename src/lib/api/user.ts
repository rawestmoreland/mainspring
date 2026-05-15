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
  oauthLogin: async (provider: 'google' | 'apple' | 'discord') => {
    pb.authStore.clear();

    let popup: Window | null = null;

    const authPromise = pb.collection('users').authWithOAuth2({
      provider,
      urlCallback: (url) => {
        popup = window.open(
          url,
          '_blank',
          'width=600,height=700,left=200,top=100',
        );
      },
    });

    // When the popup closes, give authPromise 2 seconds to resolve before
    // treating it as a user cancellation. Successful auth always sends its
    // postMessage before the popup closes, so authPromise wins in milliseconds.
    // Only a genuine user-cancel leaves the promise unsettled past that window.
    const cancelOnClose = new Promise<never>((_, reject) => {
      const interval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(interval);
          setTimeout(() => reject(new Error('OAuth cancelled')), 2000);
        }
      }, 300);

      authPromise.finally(() => clearInterval(interval));
    });

    return Promise.race([authPromise, cancelOnClose]);
  },
  signup: async (email: string, password: string, displayName: string) => {
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      display_name: displayName,
      subscription_status: 'free',
    });
    const auth = await pb.collection('users').authWithPassword(email, password);
    return auth;
  },
  passwordReset: async (email: string) => {
    await pb.collection('users').requestPasswordReset(email);
  },
  logout: async () => {
    pb.authStore.clear();
  },
};
