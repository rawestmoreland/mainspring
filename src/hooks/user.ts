import { UserApi } from '#/lib/api/user';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import pb from '#/lib/pocketbase';

export const useUser = () => {
  const valid = pb.authStore.isValid;
  return useQuery({
    queryKey: ['user'],
    queryFn: () => UserApi.getUser(),
    enabled: valid,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => {
      return UserApi.login(email, password);
    },
    onError: (error) => {
      console.error(error);
    },
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
      queryClient.setQueryData(['user'], null);
    },
  });
};
