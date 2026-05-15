import { Link, createFileRoute } from '@tanstack/react-router';
import { Camera, FolderOpen, ListChecks, Timer } from 'lucide-react';
import { UpgradeButton } from '#/components/primitives/UpgradeButton';
import { useAuth } from '#/hooks/auth';
import { useSubscription } from '#/hooks/subscription';

export const Route = createFileRoute('/pro')({
  component: ProPage,
});

const FEATURES = [
  {
    icon: FolderOpen,
    label: 'Unlimited Projects',
    title: 'Track every flip',
    description:
      'Free accounts are limited to 2 active projects. Upgrade to Pro and manage your entire inventory without limits.',
    badge: null,
  },
  {
    icon: Camera,
    label: 'Unlimited Photos',
    title: 'Capture every detail',
    description:
      'Free accounts get 3 photos per project. Pro unlocks unlimited photo documentation — before, during, after, and listing shots.',
    badge: null,
  },
  {
    icon: Timer,
    label: 'Advanced Timegrapher',
    title: 'Full positional logging',
    description:
      'Free users log a single rate and amplitude reading. Pro exposes the full 6-position grid (DU, DD, CU, CD, CL, CR) with automated delta tracking across sessions.',
    badge: null,
  },
  {
    icon: ListChecks,
    label: 'Shopping List',
    title: 'Never miss a target',
    description:
      'Build a wishlist of watches and parts to track. Set price targets, add notes, and keep your acquisition pipeline organized in one place.',
    badge: null,
  },
] as const;

function ProPage() {
  const { user } = useAuth();
  const { isPro } = useSubscription();

  if (isPro) {
    return (
      <div className='flex flex-col items-center justify-center py-20'>
        <div className='flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-10 py-14 text-center max-w-sm w-full'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10'>
            <svg
              width='20'
              height='20'
              viewBox='0 0 8 8'
              fill='currentColor'
              className='text-amber-400'
            >
              <path d='M4 0L5.2 2.8L8 3.1L6 5.1L6.5 8L4 6.6L1.5 8L2 5.1L0 3.1L2.8 2.8Z' />
            </svg>
          </div>
          <div>
            <p className='font-mono text-[10px] tracking-widest text-amber-400 uppercase mb-2'>
              Active Plan
            </p>
            <p className='font-serif font-semibold text-foreground text-lg mb-1'>
              You're on Pro
            </p>
            <p className='text-sm text-muted-foreground'>
              All features are unlocked. Manage your billing from your profile.
            </p>
          </div>
          <Link
            to='/settings/profile'
            className='font-mono text-[11px] tracking-widest text-muted-foreground hover:text-foreground transition-colors uppercase'
          >
            Manage Billing →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8 max-w-3xl'>
      {/* Hero */}
      <div className='rounded-xl border border-border bg-card px-8 py-10'>
        <div className='flex items-center gap-2 mb-4'>
          <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] tracking-widest border border-amber-500/40 bg-amber-500/10 text-amber-400 uppercase'>
            <svg
              width='8'
              height='8'
              viewBox='0 0 8 8'
              fill='currentColor'
              className='shrink-0'
            >
              <path d='M4 0L5.2 2.8L8 3.1L6 5.1L6.5 8L4 6.6L1.5 8L2 5.1L0 3.1L2.8 2.8Z' />
            </svg>
            Hairspring Pro
          </span>
        </div>
        <h1 className='font-serif font-semibold text-foreground text-2xl mb-2'>
          Unlock the full Hairspring experience
        </h1>
        <p className='text-sm text-muted-foreground leading-relaxed mb-6 max-w-xl'>
          Pro gives you the tools serious collectors and flippers need —
          unlimited projects, full photo documentation, advanced movement
          analytics, and more. One flat price, every feature, forever.
        </p>
        {user?.id && <UpgradeButton pbUserId={user.id} />}
      </div>

      {/* Feature grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {FEATURES.map(({ icon: Icon, label, title, description, badge }) => (
          <div
            key={label}
            className='rounded-xl border border-border bg-card px-6 py-7 flex flex-col gap-3'
          >
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10'>
              <Icon className='h-5 w-5 text-amber-400' />
            </div>
            <div>
              <p className='font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-1'>
                {label}
              </p>
              <p className='font-serif font-semibold text-foreground mb-2'>
                {title}
              </p>
              <p className='text-sm text-muted-foreground leading-relaxed'>
                {description}
              </p>
            </div>
            {badge && (
              <span className='self-start font-mono text-[9px] tracking-widest px-2 py-0.5 rounded border border-border text-muted-foreground uppercase'>
                {badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className='flex items-center justify-between rounded-xl border border-border bg-card px-6 py-5'>
        <div>
          <p className='font-serif font-semibold text-foreground'>
            One price. Every feature.
          </p>
          <p className='font-mono text-[10px] tracking-widest text-muted-foreground uppercase mt-0.5'>
            Cancel anytime
          </p>
        </div>
        {user?.id && <UpgradeButton pbUserId={user.id} />}
      </div>
    </div>
  );
}
