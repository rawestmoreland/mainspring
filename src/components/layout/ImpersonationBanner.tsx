import pb from '#/lib/pocketbase';
import { useImpersonation } from '#/hooks/impersonation';
import { useTranslation } from 'react-i18next';

export function ImpersonationBanner() {
  const { t } = useTranslation();
  const { isImpersonating, exitImpersonation } = useImpersonation();

  if (!isImpersonating) return null;

  const email = (pb.authStore.record as { email?: string } | null)?.email;

  return (
    <div className='flex items-center justify-between gap-3 px-4 py-2 bg-amber-950/60 border-b border-amber-700/40 font-mono text-xs text-amber-300'>
      <span className='flex items-center gap-2'>
        <span className='inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse' />
        {t('impersonating')}
        {email && (
          <>
            {' '}
            <span className='text-amber-200 font-semibold'>{email}</span>
          </>
        )}
      </span>
      <button
        type='button'
        onClick={exitImpersonation}
        className='px-2 py-0.5 rounded border border-amber-700/60 bg-amber-900/40 text-amber-300 hover:bg-amber-800/50 hover:text-amber-100 transition-colors'
      >
        {t('exit')}
      </button>
    </div>
  );
}
