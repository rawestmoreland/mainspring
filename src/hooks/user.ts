import { UserApi } from '#/lib/api/user';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useGoogleAnalytics } from 'tanstack-router-ga4';

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => UserApi.getUser(),
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const ga4 = useGoogleAnalytics();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => {
      return UserApi.login(email, password);
    },
    onError: (error) => {
      console.error(error);
    },
    onSuccess: (data) => {
      // Track login event in GA4
      ga4.event('login', {
        category: 'User',
        label: 'User logged in',
        userInfo: {
          userId: data.record.id,
        },
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useSignup = () => {
  const queryClient = useQueryClient();
  const ga4 = useGoogleAnalytics();

  return useMutation({
    mutationFn: ({
      email,
      password,
      displayName,
    }: {
      email: string;
      password: string;
      displayName: string;
    }) => {
      return UserApi.signup(email, password, displayName);
    },
    onError: (error) => console.error(error),
    onSuccess: (data) => {
      // Track sign-up event in GA4
      ga4.event('sign_up', {
        category: 'User',
        label: 'New user signed up',
        userInfo: {
          userId: data.record.id,
        },
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useOauth2Login = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      provider,
    }: {
      provider: 'google' | 'apple' | 'discord';
    }) => {
      return UserApi.oauthLogin(provider);
    },
    onError: (error) => console.error(error),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => UserApi.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
};
