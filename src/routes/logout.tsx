import { useAuth } from '#/hooks/auth';
import { useLogout } from '#/hooks/user';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/logout')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const logout = useLogout();

  useEffect(() => {
    const performLogout = async () => {
      await logout.mutateAsync();
      navigate({ to: '/login', replace: true });
    };
    if (!isLoading && user) {
      performLogout();
    }
  }, [logout, user, isLoading]);

  return null;
}
