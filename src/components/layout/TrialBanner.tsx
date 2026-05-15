import { Link } from '@tanstack/react-router';
import { cn } from '#/lib/helpers';

type TrialBannerProps = {
  isAppTrial: boolean;
  trialDaysRemaining: number | null;
};

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 14 14'
      fill='none'
      className={className}
      aria-hidden='true'
    >
      <circle cx='7' cy='7' r='6' stroke='currentColor' strokeWidth='1.5' />
      <path d='M7 4v3.5l2 1.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

export function TrialBanner({
  isAppTrial,
  trialDaysRemaining,
}: TrialBannerProps) {
  if (!isAppTrial || trialDaysRemaining === null) return null;

  const urgent = trialDaysRemaining <= 3;
  const soon = trialDaysRemaining <= 7 && trialDaysRemaining > 3;

  return (
    <div
      role='status'
      aria-label='Trial subscription notice'
      className={cn(
        'flex items-center justify-between gap-3 border-b px-4 py-2 md:px-9 md:rounded-tl-xl md:rounded-tr-xl',
        urgent && 'border-amber-500/70 bg-amber-950',
        soon && 'border-amber-700/60 bg-amber-950',
        !urgent && !soon && 'border-zinc-700 bg-zinc-900',
      )}
    >
      <div className='flex items-center gap-2 min-w-0'>
        <ClockIcon
          className={cn(
            'shrink-0',
            urgent && 'text-amber-400',
            soon && 'text-amber-400',
            !urgent && !soon && 'text-zinc-300',
          )}
        />
        <p
          className={cn(
            'font-mono text-[11px] tracking-wide truncate',
            urgent && 'text-amber-100',
            soon && 'text-amber-100',
            !urgent && !soon && 'text-zinc-100',
          )}
        >
          {urgent ? (
            <>
              <span className='font-semibold'>
                Pro trial ends in {trialDaysRemaining}{' '}
                {trialDaysRemaining === 1 ? 'day' : 'days'}.
              </span>{' '}
              <span className='hidden sm:inline'>
                Subscribe to keep uploads, timegrapher, and shopping lists.
              </span>
            </>
          ) : soon ? (
            <>
              <span className='font-semibold'>
                Trial ends in {trialDaysRemaining} days.
              </span>{' '}
              <span className='hidden sm:inline'>No credit card required to upgrade.</span>
            </>
          ) : (
            <>
              <span className='font-medium'>14-day Pro trial</span>
              <span className='hidden sm:inline text-zinc-300'>
                {' '}— full access, no credit card required.
              </span>
            </>
          )}
        </p>
      </div>

      <Link
        to='/pro'
        className={cn(
          'shrink-0 font-mono text-[10px] tracking-widest uppercase px-3 py-1 rounded border transition-colors',
          urgent &&
            'border-amber-400 bg-amber-500/25 text-amber-100 hover:bg-amber-500/40',
          soon &&
            'border-amber-500/80 bg-amber-500/15 text-amber-100 hover:bg-amber-500/30',
          !urgent &&
            !soon &&
            'border-zinc-500 bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
        )}
      >
        {urgent ? 'Upgrade' : 'View Pro'}
      </Link>
    </div>
  );
}
