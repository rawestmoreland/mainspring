import { Link } from '@tanstack/react-router';
import { cn } from '#/lib/helpers';

type TrialBannerProps = {
  isAppTrial: boolean;
  trialDaysRemaining: number | null;
};

export function TrialBanner({
  isAppTrial,
  trialDaysRemaining,
}: TrialBannerProps) {
  if (!isAppTrial || trialDaysRemaining === null) return null;

  const urgent = trialDaysRemaining <= 3;
  const soon = trialDaysRemaining <= 7 && trialDaysRemaining > 3;

  return (
    <div
      className={cn(
        '-mx-4 mb-0 border-b px-4 py-2.5 md:-mx-9 md:px-9',
        urgent &&
          'border-amber-500/50 bg-amber-500/15 text-amber-100',
        soon &&
          'border-amber-500/35 bg-amber-500/10 text-amber-50/95',
        !urgent &&
          !soon &&
          'border-border bg-muted/40 text-muted-foreground',
      )}
    >
      <p className='font-mono text-[11px] leading-relaxed tracking-wide md:text-xs'>
        {urgent ? (
          <>
            <span className='font-semibold text-amber-200'>
              Pro trial ends in {trialDaysRemaining}{' '}
              {trialDaysRemaining === 1 ? 'day' : 'days'}.
            </span>{' '}
            Subscribe to keep uploads, timegrapher, shopping lists, and more.{' '}
            <Link
              to='/pro'
              className='text-amber-300 underline decoration-amber-500/60 underline-offset-2 hover:text-amber-200'
            >
              View Pro
            </Link>
          </>
        ) : soon ? (
          <>
            <span className='font-semibold text-amber-200/90'>
              Your free Pro trial ends in {trialDaysRemaining} days
            </span>{' '}
            (no credit card was required).{' '}
            <Link
              to='/pro'
              className='text-amber-200/90 underline decoration-amber-500/50 underline-offset-2 hover:text-amber-100'
            >
              Upgrade
            </Link>
          </>
        ) : (
          <>
            You&apos;re on a <span className='text-foreground'>14-day Pro trial</span>
            — full access, no credit card required.{' '}
            <Link
              to='/pro'
              className='text-primary underline underline-offset-2 hover:text-primary/90'
            >
              Plans & pricing
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
