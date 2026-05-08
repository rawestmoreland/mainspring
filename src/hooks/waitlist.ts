import { WaitlistApi } from '#/lib/api/waitlist';
import { useMutation } from '@tanstack/react-query';

export const useJoinWaitlist = () => {
  return useMutation({
    mutationFn: (email: string) => WaitlistApi.joinWaitlist(email),
  });
};
