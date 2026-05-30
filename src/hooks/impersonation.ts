'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import pb from '#/lib/pocketbase';

const IMPERSONATE_KEY = 'hs_impersonating';
const IMPERSONATE_EVENT = 'hs-impersonation-change';

export function markImpersonating() {
  localStorage.setItem(IMPERSONATE_KEY, '1');
  window.dispatchEvent(new CustomEvent(IMPERSONATE_EVENT));
}

export function useImpersonation() {
  const [isImpersonating, setIsImpersonating] = useState(
    () => localStorage.getItem(IMPERSONATE_KEY) !== null,
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const sync = () =>
      setIsImpersonating(localStorage.getItem(IMPERSONATE_KEY) !== null);
    window.addEventListener(IMPERSONATE_EVENT, sync);
    return () => window.removeEventListener(IMPERSONATE_EVENT, sync);
  }, []);

  const exitImpersonation = useCallback(() => {
    pb.authStore.clear();
    localStorage.removeItem(IMPERSONATE_KEY);
    window.dispatchEvent(new CustomEvent(IMPERSONATE_EVENT));
    queryClient.clear();
    navigate({ to: '/login' });
  }, [navigate, queryClient]);

  return { isImpersonating, exitImpersonation };
}
