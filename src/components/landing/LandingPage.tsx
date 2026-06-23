/* eslint-disable i18next/no-literal-string */
import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { usePostHog, useFeatureFlagVariantKey } from '@posthog/react';
import { useTranslation } from 'react-i18next';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { ParseKeys } from 'i18next';

// ─── Mock data for the profile preview ──────────────────────────────────────

const MOCK_PROFILE = {
  name: 'Thomas Brennan',
  subdomain: 'thomas',
  bio: 'Amateur watchmaker. Mostly vintage movements.',
  watches: [
    {
      id: 'mock-1',
      make: 'Rolex',
      model: 'Oyster Perpetual',
      reference: 'Ref. 6594',
      year: '1958',
      status: 'sold',
      posts: [
        {
          id: 'p1',
          title: 'Full service — movement cleaning and oiling',
          date: 'Nov 8, 2024',
        },
        {
          id: 'p2',
          title: 'Replaced mainspring, adjusted beat error',
          date: 'Nov 14, 2024',
        },
        {
          id: 'p3',
          title: 'Final timing — +2 s/d across positions',
          date: 'Nov 21, 2024',
        },
      ],
    },
    {
      id: 'mock-2',
      make: 'Omega',
      model: 'Constellation',
      reference: 'Cal. 561',
      year: '1969',
      status: 'in_progress',
      posts: [
        {
          id: 'p4',
          title: 'Initial assessment — worn cannon pinion',
          date: 'Jan 12, 2025',
        },
        {
          id: 'p5',
          title: 'Disassembly and ultrasonic cleaning',
          date: 'Jan 19, 2025',
        },
      ],
    },
    {
      id: 'mock-3',
      make: 'Citizen',
      model: 'Parashock',
      reference: '',
      year: '1972',
      status: 'acquired',
      posts: [],
    },
  ],
};

// ─── Shared animations ───────────────────────────────────────────────────────

const ANIMATION_STYLES = `
  @keyframes ms-fade-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ms-ring-pulse {
    0%, 100% { opacity: 0.06; transform: scale(1); }
    50%       { opacity: 0.14; transform: scale(1.04); }
  }
  .ms-fade-up-1 { animation: ms-fade-up 0.6s ease both 0.05s; }
  .ms-fade-up-2 { animation: ms-fade-up 0.6s ease both 0.15s; }
  .ms-fade-up-3 { animation: ms-fade-up 0.6s ease both 0.25s; }
  .ms-fade-up-4 { animation: ms-fade-up 0.6s ease both 0.35s; }
  .ms-ring-a    { animation: ms-ring-pulse 6s ease-in-out infinite; }
  .ms-ring-b    { animation: ms-ring-pulse 6s ease-in-out infinite 2s; }
  .ms-ring-c    { animation: ms-ring-pulse 6s ease-in-out infinite 4s; }
`;

// ─── Profile page preview (mock browser chrome) ──────────────────────────────

function ProfilePagePreview() {
  const totalPosts = MOCK_PROFILE.watches.reduce(
    (n, w) => n + w.posts.length,
    0,
  );
  return (
    <div className='max-w-2xl mx-auto rounded-xl border border-border overflow-hidden shadow-2xl shadow-black/40'>
      <div className='flex items-center gap-3 px-4 py-2.5 bg-zinc-900 border-b border-zinc-700/60'>
        <div className='flex gap-1.5'>
          <div className='w-2.5 h-2.5 rounded-full bg-zinc-700' />
          <div className='w-2.5 h-2.5 rounded-full bg-zinc-700' />
          <div className='w-2.5 h-2.5 rounded-full bg-zinc-700' />
        </div>
        <div className='flex-1 mx-2'>
          <div className='bg-zinc-800 rounded-md px-3 py-1 flex items-center gap-2'>
            <svg
              className='w-2.5 h-2.5 text-zinc-500 shrink-0'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
            >
              <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
            </svg>
            <span className='font-mono text-[10px] text-zinc-400 truncate'>
              thomas.hairspring.app
            </span>
          </div>
        </div>
        <span className='font-mono text-[9px] uppercase tracking-widest text-zinc-600 shrink-0'>
          sample
        </span>
      </div>

      <div className='bg-background overflow-y-auto max-h-[500px] pointer-events-none select-none'>
        <div className='h-12 flex items-center gap-3 px-5 border-b border-border bg-background/90'>
          <span className='font-serif font-bold text-foreground text-sm'>
            Hairspring
          </span>
          <span className='text-border'>·</span>
          <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
            {MOCK_PROFILE.name}
          </span>
        </div>

        <div className='px-5 pt-7 pb-10'>
          <div className='flex items-center gap-4 mb-7 pb-6 border-b border-border'>
            <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
              <span className='font-mono text-xs font-bold text-primary'>
                TB
              </span>
            </div>
            <div>
              <h1 className='font-serif text-lg font-bold text-foreground'>
                {MOCK_PROFILE.name}
              </h1>
              <p className='text-xs text-muted-foreground mt-0.5'>
                {MOCK_PROFILE.bio}
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <span className='font-mono text-[10px] text-muted-foreground'>
                  {MOCK_PROFILE.watches.length} projects
                </span>
                <span className='text-border'>·</span>
                <span className='font-mono text-[10px] text-muted-foreground'>
                  {totalPosts} repair logs
                </span>
              </div>
            </div>
          </div>

          <div className='mb-3.5'>
            <SectionLabel>Watch Projects</SectionLabel>
          </div>
          <div className='space-y-3'>
            {MOCK_PROFILE.watches.map((w) => {
              const meta = [w.reference, w.year].filter(Boolean).join(' · ');
              return (
                <div
                  key={w.id}
                  className='bg-card border border-border rounded overflow-hidden'
                >
                  <div className='flex items-start justify-between gap-3 px-3.5 py-3 border-b border-border bg-muted/40'>
                    <div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='font-serif font-semibold text-foreground text-sm'>
                          {w.make} {w.model}
                        </span>
                        <StatusBadge status={w.status} />
                      </div>
                      {meta && (
                        <span className='font-mono text-[10px] text-muted-foreground mt-0.5 block'>
                          {meta}
                        </span>
                      )}
                    </div>
                    {w.posts.length > 0 && (
                      <span className='font-mono text-[10px] text-muted-foreground shrink-0 pt-0.5'>
                        {w.posts.length} log{w.posts.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {w.posts.length > 0 ? (
                    w.posts.map((p) => (
                      <div
                        key={p.id}
                        className='flex justify-between items-start gap-3 px-3.5 py-2.5 border-b border-border last:border-0 text-sm'
                      >
                        <span className='text-foreground'>{p.title}</span>
                        <span className='font-mono text-xs text-muted-foreground shrink-0'>
                          {p.date}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className='px-3.5 py-2.5 text-xs text-muted-foreground italic'>
                      No repair logs yet.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Experiment gateway ──────────────────────────────────────────────────────

export function LandingPage() {
  const posthog = usePostHog();
  const variant = useFeatureFlagVariantKey('landing-page-copy-test');

  useEffect(() => {
    if (variant !== undefined) {
      posthog.capture('landing_page_viewed', {
        variant: variant ?? 'control',
        $feature_flag: 'landing-page-copy-test',
        $feature_flag_response: variant ?? 'control',
      });
    }
  }, [variant]);

  if (variant === 'angle1') return <LandingPageAngle1 />;
  if (variant === 'angle4') return <LandingPageAngle4 />;
  return <LandingPageControl />;
}

// ─── Control variant (i18n) ──────────────────────────────────────────────────

function LandingPageControl() {
  const { t, i18n } = useTranslation();
  const posthog = usePostHog();

  const { data: landingData, isPending } = useQuery({
    queryKey: ['landingstats'],
    queryFn: async () => {
      const pb = (await import('#/lib/pocketbase')).default;
      return await pb.collection('homepage_stats').getOne('1');
    },
  });

  const trackCta = () => {
    posthog.capture('landing_page_cta_clicked', {
      variant: 'control',
      cta_text: 'Get started',
    });
    window.rdt?.('track', 'Lead', { conversionId: crypto.randomUUID() });
  };

  const features = [
    {
      symbol: '◈',
      titleKey: 'landingFeature1Title',
      descKey: 'landingFeature1Desc',
    },
    {
      symbol: '◷',
      titleKey: 'landingFeature2Title',
      descKey: 'landingFeature2Desc',
    },
    {
      symbol: '⊡',
      titleKey: 'landingFeature3Title',
      descKey: 'landingFeature3Desc',
    },
    {
      symbol: '⚙',
      titleKey: 'landingFeature4Title',
      descKey: 'landingFeature4Desc',
    },
    {
      symbol: '◎',
      titleKey: 'landingFeature5Title',
      descKey: 'landingFeature5Desc',
    },
    {
      symbol: '⊞',
      titleKey: 'landingFeature6Title',
      descKey: 'landingFeature6Desc',
    },
  ] as const;

  const steps = [
    { n: '01', titleKey: 'landingStep1Title', descKey: 'landingStep1Desc' },
    { n: '02', titleKey: 'landingStep2Title', descKey: 'landingStep2Desc' },
    { n: '03', titleKey: 'landingStep3Title', descKey: 'landingStep3Desc' },
  ] as const;

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <style>{ANIMATION_STYLES}</style>

      <nav className='fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md border-b border-border'>
        <div className='max-w-6xl mx-auto px-5 h-14 flex items-center justify-between'>
          <span className='font-serif text-lg font-bold text-primary tracking-tight'>
            Hairspring
          </span>
          <div className='flex items-center gap-3'>
            <Link
              to='/login'
              className='font-mono text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5'
            >
              {t('landingNavSignIn')}
            </Link>
            <Link
              to='/signup'
              className='font-mono text-xs bg-primary text-primary-foreground font-semibold px-4 py-1.5 rounded hover:bg-primary/90 transition-colors'
            >
              {t('landingNavSignUp')}
            </Link>
          </div>
        </div>
      </nav>

      <section className='relative flex items-center pt-24 pb-16 px-5 overflow-hidden min-h-[92vh]'>
        <div className='pointer-events-none absolute inset-0 flex items-center lg:justify-start lg:pl-16 justify-center'>
          <div className='ms-ring-a absolute lg:relative w-175 h-175 rounded-full border border-primary' />
          <div className='ms-ring-b absolute lg:hidden w-125 h-125 rounded-full border border-primary' />
          <div className='ms-ring-c absolute lg:hidden w-80 h-80 rounded-full border border-primary' />
        </div>
        <div className='pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-background/60 to-background' />

        <div className='relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
          <div className='text-center lg:text-left'>
            <p className='ms-fade-up-1 font-mono text-xs uppercase tracking-[0.2em] text-primary mb-5'>
              {t('landingHobbyistBadge')}
            </p>
            <h1 className='ms-fade-up-2 font-serif font-bold text-foreground leading-tight text-4xl sm:text-5xl lg:text-5xl xl:text-6xl mb-6'>
              {t('landingHeroHeading1')}
              <br />
              <span className='text-primary'>{t('landingHeroHeading2')}</span>
            </h1>
            <p className='ms-fade-up-3 text-muted-foreground text-lg max-w-xl lg:max-w-none mx-auto mb-10 leading-relaxed'>
              {t('landingHeroBody')}
            </p>
            <div className='ms-fade-up-4 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3'>
              <Link
                to='/signup'
                className='font-mono text-sm bg-primary text-primary-foreground font-bold px-7 py-3 rounded hover:bg-primary/90 transition-colors w-full sm:w-auto text-center'
                onClick={trackCta}
              >
                {t('landingCtaPrimary')}
              </Link>
              <Link
                to='/login'
                className='font-mono text-sm border border-border text-muted-foreground px-7 py-3 rounded hover:border-foreground/40 hover:text-foreground transition-colors w-full sm:w-auto text-center'
              >
                {t('landingNavSignIn')}
              </Link>
            </div>
          </div>
          <div className='ms-fade-up-4 hidden lg:block'>
            <ProfilePagePreview />
          </div>
        </div>
      </section>

      {isPending || (landingData?.watch_count ?? 0) < 100 ? (
        <div className='bg-card border-y border-border'>
          <div className='max-w-6xl mx-auto px-5 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-border'>
            {[
              { symbol: '◎', labelKey: 'landingStatFreeForever' },
              { symbol: '◈', labelKey: 'landingStatNoCreditCard' },
              { symbol: '⊞', labelKey: 'landingStatAnyBrowser' },
              { symbol: '◷', labelKey: 'landingStatHobbyists' },
            ].map((item) => (
              <div
                key={item.labelKey}
                className='flex flex-col items-center justify-center gap-1 sm:px-8'
              >
                <span className='font-mono text-xl text-primary'>
                  {item.symbol}
                </span>
                <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground'>
                  {t(item.labelKey as ParseKeys)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='bg-card border-y border-border'>
          <div className='max-w-6xl mx-auto px-5 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-border'>
            <div className='flex flex-col items-center justify-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-primary'>
                {landingData!.watch_count}+
              </span>
              <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                {t('landingStatWatchesTracked')}
              </span>
            </div>
            <div className='flex flex-col items-center justify-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-primary'>
                {landingData!.equipment_count}+
              </span>
              <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                {t('landingStatPartsCatalogued')}
              </span>
            </div>
            <div className='flex flex-col items-center justify-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-primary'>
                {landingData!.total_hours}+
              </span>
              <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                {t('landingStatBenchHours')}
              </span>
            </div>
            <div className='flex flex-col items-center justify-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-primary'>
                {t('landingStatFree')}
              </span>
              <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                {t('landingStatToStart')}
              </span>
            </div>
          </div>
        </div>
      )}

      <section className='max-w-6xl mx-auto px-5 py-20'>
        <div className='mb-12 text-center'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3'>
            {t('landingFeaturesEyebrow')}
          </p>
          <h2 className='font-serif font-bold text-foreground text-3xl sm:text-4xl'>
            {t('landingFeaturesHeading')}
          </h2>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {features.map((f) => (
            <div
              key={f.titleKey}
              className='bg-card border border-border rounded-lg p-6 group hover:border-primary/30 transition-colors'
            >
              <div className='flex items-center gap-3 mb-3'>
                <span className='font-mono text-lg text-primary group-hover:scale-110 transition-transform inline-block'>
                  {f.symbol}
                </span>
                <span className='font-serif font-semibold text-foreground text-base'>
                  {t(f.titleKey)}
                </span>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {t(f.descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className='max-w-3xl mx-auto px-5 my-8'>
        <div className='bg-card border-l-2 border-primary pl-8 pr-8 py-8'>
          <p className='font-serif text-xl sm:text-2xl text-foreground leading-relaxed italic'>
            &ldquo;{t('landingQuote')}&rdquo;
          </p>
          <p className='font-mono text-xs text-muted-foreground mt-5 uppercase tracking-widest'>
            &mdash; Hairspring
          </p>
        </div>
      </div>

      <section className='max-w-6xl mx-auto px-5 py-20'>
        <div className='mb-12 text-center'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3'>
            {t('landingHowEyebrow')}
          </p>
          <h2 className='font-serif font-bold text-foreground text-3xl sm:text-4xl'>
            {t('landingHowHeading')}
          </h2>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto'>
          {steps.map((step) => (
            <div key={step.n} className='flex flex-col gap-3'>
              <span className='font-mono text-4xl font-bold text-muted-foreground leading-none'>
                {step.n}
              </span>
              <div className='w-8 h-px bg-primary' />
              <h3 className='font-serif font-semibold text-foreground text-lg'>
                {t(step.titleKey)}
              </h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {t(step.descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className='px-5 my-8'>
        <div className='bg-card rounded-2xl p-10 sm:p-14 mx-auto max-w-2xl text-center border border-border'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-primary mb-4'>
            {t('landingCtaEyebrow')}
          </p>
          <h2 className='font-serif font-bold text-foreground text-3xl sm:text-4xl mb-3'>
            {t('landingCtaHeading')}
          </h2>
          <p className='text-muted-foreground text-base mb-8'>
            {t('landingCtaBody')}
          </p>
          <Link
            to='/signup'
            className='inline-block font-mono text-sm bg-primary text-primary-foreground font-bold px-10 py-3.5 rounded hover:bg-primary/90 transition-colors'
            onClick={trackCta}
          >
            {t('landingCtaPrimary')}
          </Link>
        </div>
      </div>

      <footer className='max-w-6xl mx-auto px-5 py-10 mt-8 border-t border-border'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <span className='font-serif font-bold text-muted-foreground text-sm'>
              Hairspring
            </span>
            <span className='font-mono text-xs text-muted-foreground'>
              &copy; {new Date().getFullYear()} · {t('landingFooterTagline')}
            </span>
          </div>
          <div className='flex items-center gap-5'>
            <div className='flex items-center gap-1 border border-border rounded px-2 py-1'>
              {(['en', 'de', 'fr'] as const).map((l, idx) => (
                <>
                  {idx > 0 && (
                    <span
                      key={`sep-${l}`}
                      className='font-mono text-[10px] text-border'
                    >
                      ·
                    </span>
                  )}
                  <Link
                    key={l}
                    to='/$lang'
                    params={{ lang: l }}
                    preload={false}
                    className={`font-mono text-[10px] uppercase tracking-widest px-1 transition-colors ${i18n.language === l ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {l}
                  </Link>
                </>
              ))}
            </div>
            <Link
              to='/login'
              className='font-mono text-xs text-muted-foreground hover:text-foreground transition-colors'
            >
              {t('landingNavSignIn')}
            </Link>
            <Link
              to='/signup'
              className='font-mono text-xs text-muted-foreground hover:text-foreground transition-colors'
            >
              {t('landingNavSignUp')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Variant: angle1 — Recognition ("An audience that gets it") ─────────────

function LandingPageAngle1() {
  const posthog = usePostHog();

  const { data: landingData, isPending } = useQuery({
    queryKey: ['landingstats'],
    queryFn: async () => {
      const pb = (await import('#/lib/pocketbase')).default;
      return await pb.collection('homepage_stats').getOne('1');
    },
  });

  const trackCta = () => {
    posthog.capture('landing_page_cta_clicked', {
      variant: 'angle1',
      cta_text: 'Claim your page',
    });
    window.rdt?.('track', 'Lead', { conversionId: crypto.randomUUID() });
  };

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <style>{ANIMATION_STYLES}</style>

      <nav className='fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md border-b border-border'>
        <div className='max-w-6xl mx-auto px-5 h-14 flex items-center justify-between'>
          <span className='font-serif text-lg font-bold text-primary tracking-tight'>
            Hairspring
          </span>
          <div className='flex items-center gap-3'>
            <Link
              to='/login'
              className='font-mono text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5'
            >
              Sign in
            </Link>
            <Link
              to='/signup'
              className='font-mono text-xs bg-primary text-primary-foreground font-semibold px-4 py-1.5 rounded hover:bg-primary/90 transition-colors'
              onClick={trackCta}
            >
              Claim your page
            </Link>
          </div>
        </div>
      </nav>

      <section className='relative flex items-center pt-24 pb-16 px-5 overflow-hidden min-h-[92vh]'>
        <div className='pointer-events-none absolute inset-0 flex items-center lg:justify-start lg:pl-16 justify-center'>
          <div className='ms-ring-a absolute lg:relative w-175 h-175 rounded-full border border-primary' />
          <div className='ms-ring-b absolute lg:hidden w-125 h-125 rounded-full border border-primary' />
          <div className='ms-ring-c absolute lg:hidden w-80 h-80 rounded-full border border-primary' />
        </div>
        <div className='pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-background/60 to-background' />

        <div className='relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
          <div className='text-center lg:text-left'>
            <p className='ms-fade-up-1 font-mono text-xs uppercase tracking-[0.2em] text-primary mb-5'>
              For the watchmaker who shares the craft
            </p>
            <h1 className='ms-fade-up-2 font-serif font-bold text-foreground leading-tight text-4xl sm:text-5xl lg:text-5xl xl:text-6xl mb-6'>
              Share your work with people who actually know what they&apos;re
              looking at.
            </h1>
            <p className='ms-fade-up-3 text-muted-foreground text-lg max-w-xl lg:max-w-none mx-auto mb-10 leading-relaxed'>
              Every project you finish gets its own public page at
              yourname.hairspring.app — repair logs, photos, and the full story
              of every movement you&apos;ve touched. Free for every account.
            </p>
            <div className='ms-fade-up-4 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3'>
              <Link
                to='/signup'
                className='font-mono text-sm bg-primary text-primary-foreground font-bold px-7 py-3 rounded hover:bg-primary/90 transition-colors w-full sm:w-auto text-center'
                onClick={trackCta}
              >
                Claim your page →
              </Link>
              <Link
                to='/login'
                className='font-mono text-sm border border-border text-muted-foreground px-7 py-3 rounded hover:border-foreground/40 hover:text-foreground transition-colors w-full sm:w-auto text-center'
              >
                Sign in
              </Link>
            </div>
          </div>
          <div className='ms-fade-up-4 hidden lg:block'>
            <ProfilePagePreview />
          </div>
        </div>
      </section>

      {isPending || (landingData?.watch_count ?? 0) < 100 ? (
        <div className='bg-card border-y border-border'>
          <div className='max-w-6xl mx-auto px-5 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-border'>
            {[
              { symbol: '◎', label: 'Free forever' },
              { symbol: '◈', label: 'No credit card' },
              { symbol: '⊞', label: 'Works in any browser' },
              { symbol: '◷', label: 'Built for hobbyists' },
            ].map((item) => (
              <div
                key={item.label}
                className='flex flex-col items-center justify-center gap-1 sm:px-8'
              >
                <span className='font-mono text-xl text-primary'>
                  {item.symbol}
                </span>
                <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground'>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='bg-card border-y border-border'>
          <div className='max-w-6xl mx-auto px-5 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-border'>
            <div className='flex flex-col items-center justify-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-primary'>
                {landingData!.watch_count}+
              </span>
              <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                Watches Tracked
              </span>
            </div>
            <div className='flex flex-col items-center justify-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-primary'>
                {landingData!.equipment_count}+
              </span>
              <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                Parts Catalogued
              </span>
            </div>
            <div className='flex flex-col items-center justify-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-primary'>
                {landingData!.total_hours}+
              </span>
              <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                Bench Hours Recorded
              </span>
            </div>
            <div className='flex flex-col items-center justify-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-primary'>
                free
              </span>
              <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                To Start
              </span>
            </div>
          </div>
        </div>
      )}

      <section className='max-w-6xl mx-auto px-5 py-20'>
        <div className='mb-12 text-center'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3'>
            Everything you need
          </p>
          <h2 className='font-serif font-bold text-foreground text-3xl sm:text-4xl'>
            For the hobbyist who takes the craft seriously.
          </h2>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[
            {
              symbol: '◈',
              title: 'Watch Projects',
              desc: 'Log every movement on your bench. Status, service history, reference details, and photos — all in one place.',
            },
            {
              symbol: '◷',
              title: 'Repair Logs',
              desc: 'Document each bench session with notes, time spent, and what you actually did. Build a searchable history of your work.',
            },
            {
              symbol: '⊡',
              title: 'Parts Inventory',
              desc: "Know what's in your drawers before you order more. Track stems, crystals, mainsprings, and anything else you keep in stock.",
            },
            {
              symbol: '⚙',
              title: 'Tool Log',
              desc: 'Catalogue your bench setup from your staking set to your movement holder. Know exactly what you have.',
            },
            {
              symbol: '◎',
              title: 'Public Profile',
              desc: 'Share your work with the community. Your own subdomain with your repair posts and watch portfolio.',
            },
            {
              symbol: '⊞',
              title: 'Bench Overview',
              desc: 'All your active projects, recent sessions, and low-stock parts at a glance. Your whole hobby in one dashboard.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className='bg-card border border-border rounded-lg p-6 group hover:border-primary/30 transition-colors'
            >
              <div className='flex items-center gap-3 mb-3'>
                <span className='font-mono text-lg text-primary group-hover:scale-110 transition-transform inline-block'>
                  {f.symbol}
                </span>
                <span className='font-serif font-semibold text-foreground text-base'>
                  {f.title}
                </span>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className='max-w-3xl mx-auto px-5 my-8'>
        <div className='bg-card border-l-2 border-primary pl-8 pr-8 py-8'>
          <p className='font-serif text-xl sm:text-2xl text-foreground leading-relaxed italic'>
            &ldquo;Built for people who&apos;d rather be at the bench than on a
            spreadsheet &mdash; and who have more movements in ziplock bags than
            they&apos;d like to admit.&rdquo;
          </p>
          <p className='font-mono text-xs text-muted-foreground mt-5 uppercase tracking-widest'>
            &mdash; Hairspring
          </p>
        </div>
      </div>

      <section className='max-w-6xl mx-auto px-5 py-20'>
        <div className='mb-12 text-center'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3'>
            Simple by design
          </p>
          <h2 className='font-serif font-bold text-foreground text-3xl sm:text-4xl'>
            Simple enough to use after every bench session.
          </h2>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto'>
          {[
            {
              n: '01',
              title: 'Add a project',
              desc: "Log the watch: make, model, movement, reference, and what you're trying to accomplish. Attach photos straight from your phone.",
            },
            {
              n: '02',
              title: 'Document the work',
              desc: 'Write up each bench session, record parts used, and photograph the movement as you go. Every job, searchable later.',
            },
            {
              n: '03',
              title: 'Build your archive',
              desc: 'Watch your repair history grow. Refer back to old notes, track patterns across similar movements, and share your best work.',
            },
          ].map((step) => (
            <div key={step.n} className='flex flex-col gap-3'>
              <span className='font-mono text-4xl font-bold text-muted-foreground leading-none'>
                {step.n}
              </span>
              <div className='w-8 h-px bg-primary' />
              <h3 className='font-serif font-semibold text-foreground text-lg'>
                {step.title}
              </h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className='px-5 my-8'>
        <div className='bg-card rounded-2xl p-10 sm:p-14 mx-auto max-w-2xl text-center border border-border'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-primary mb-4'>
            Free to start
          </p>
          <h2 className='font-serif font-bold text-foreground text-3xl sm:text-4xl mb-3'>
            Ready to bring order to the bench?
          </h2>
          <p className='text-muted-foreground text-base mb-8'>
            Free to use. No credit card required.
          </p>
          <Link
            to='/signup'
            className='inline-block font-mono text-sm bg-primary text-primary-foreground font-bold px-10 py-3.5 rounded hover:bg-primary/90 transition-colors'
            onClick={trackCta}
          >
            Claim your page →
          </Link>
        </div>
      </div>

      <footer className='max-w-6xl mx-auto px-5 py-10 mt-8 border-t border-border'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-3'>
          <div className='flex items-center gap-4'>
            <span className='font-serif font-bold text-muted-foreground text-sm'>
              Hairspring
            </span>
            <span className='font-mono text-xs text-muted-foreground'>
              &copy; {new Date().getFullYear()} · Built for bench hobbyists.
            </span>
          </div>
          <div className='flex items-center gap-5'>
            <Link
              to='/login'
              className='font-mono text-xs text-muted-foreground hover:text-foreground transition-colors'
            >
              Sign in
            </Link>
            <Link
              to='/signup'
              className='font-mono text-xs text-muted-foreground hover:text-foreground transition-colors'
              onClick={trackCta}
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Variant: angle4 — Scarcity/Claim ("Stake your place") ──────────────────

function LandingPageAngle4() {
  const posthog = usePostHog();

  const { data: landingData, isPending } = useQuery({
    queryKey: ['landingstats'],
    queryFn: async () => {
      const pb = (await import('#/lib/pocketbase')).default;
      return await pb.collection('homepage_stats').getOne('1');
    },
  });

  const trackCta = () => {
    posthog.capture('landing_page_cta_clicked', {
      variant: 'angle4',
      cta_text: 'Claim yourname.hairspring.app',
    });
    window.rdt?.('track', 'Lead', { conversionId: crypto.randomUUID() });
  };

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <style>{ANIMATION_STYLES}</style>

      <nav className='fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md border-b border-border'>
        <div className='max-w-6xl mx-auto px-5 h-14 flex items-center justify-between'>
          <span className='font-serif text-lg font-bold text-primary tracking-tight'>
            Hairspring
          </span>
          <div className='flex items-center gap-3'>
            <Link
              to='/login'
              className='font-mono text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5'
            >
              Sign in
            </Link>
            <Link
              to='/signup'
              className='font-mono text-xs bg-primary text-primary-foreground font-semibold px-4 py-1.5 rounded hover:bg-primary/90 transition-colors'
              onClick={trackCta}
            >
              Claim your page
            </Link>
          </div>
        </div>
      </nav>

      <section className='relative flex items-center pt-24 pb-16 px-5 overflow-hidden min-h-[92vh]'>
        <div className='pointer-events-none absolute inset-0 flex items-center lg:justify-start lg:pl-16 justify-center'>
          <div className='ms-ring-a absolute lg:relative w-175 h-175 rounded-full border border-primary' />
          <div className='ms-ring-b absolute lg:hidden w-125 h-125 rounded-full border border-primary' />
          <div className='ms-ring-c absolute lg:hidden w-80 h-80 rounded-full border border-primary' />
        </div>
        <div className='pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-background/60 to-background' />

        <div className='relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-16 items-center'>
          <div className='min-w-0 text-center lg:text-left'>
            <p className='ms-fade-up-1 font-mono text-xs uppercase tracking-[0.2em] text-primary mb-5'>
              Your name. Your craft. Your subdomain.
            </p>
            <h1 className='ms-fade-up-2 font-serif font-bold text-foreground leading-tight text-4xl sm:text-5xl lg:text-5xl xl:text-6xl mb-6 break-words'>
              Claim your spot at{' '}
              <span className='text-primary'>yourname.hairspring.app.</span>
            </h1>
            <p className='ms-fade-up-3 text-muted-foreground text-lg max-w-xl lg:max-w-none mx-auto mb-10 leading-relaxed'>
              Your own public profile for your watch projects and repair logs.
              Log every movement. Share every session. Free — and yours to keep.
            </p>
            <div className='ms-fade-up-4 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3'>
              <Link
                to='/signup'
                className='font-mono text-sm bg-primary text-primary-foreground font-bold px-7 py-3 rounded hover:bg-primary/90 transition-colors w-full sm:w-auto text-center'
                onClick={trackCta}
              >
                Claim yourname.hairspring.app →
              </Link>
              <Link
                to='/login'
                className='font-mono text-sm border border-border text-muted-foreground px-7 py-3 rounded hover:border-foreground/40 hover:text-foreground transition-colors w-full sm:w-auto text-center'
              >
                Sign in
              </Link>
            </div>
            <p className='ms-fade-up-4 font-mono text-[11px] text-muted-foreground mt-5 uppercase tracking-widest'>
              Free forever · No credit card required · Subdomains are first-come
            </p>
          </div>
          <div className='ms-fade-up-4 hidden lg:block'>
            <div className='font-mono text-xs text-primary mb-2 text-center'>
              yourname.hairspring.app
            </div>
            <ProfilePagePreview />
          </div>
        </div>
      </section>

      {isPending || (landingData?.watch_count ?? 0) < 100 ? (
        <div className='bg-card border-y border-border'>
          <div className='max-w-6xl mx-auto px-5 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-border'>
            {[
              { symbol: '◎', label: 'Free forever' },
              { symbol: '◈', label: 'No credit card' },
              { symbol: '⊞', label: 'Works in any browser' },
              { symbol: '◷', label: 'Built for hobbyists' },
            ].map((item) => (
              <div
                key={item.label}
                className='flex flex-col items-center justify-center gap-1 sm:px-8'
              >
                <span className='font-mono text-xl text-primary'>
                  {item.symbol}
                </span>
                <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground'>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='bg-card border-y border-border'>
          <div className='max-w-6xl mx-auto px-5 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-border'>
            <div className='flex flex-col items-center justify-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-primary'>
                {landingData!.watch_count}+
              </span>
              <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                Watches Tracked
              </span>
            </div>
            <div className='flex flex-col items-center justify-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-primary'>
                {landingData!.equipment_count}+
              </span>
              <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                Parts Catalogued
              </span>
            </div>
            <div className='flex flex-col items-center justify-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-primary'>
                {landingData!.total_hours}+
              </span>
              <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                Bench Hours Recorded
              </span>
            </div>
            <div className='flex flex-col items-center justify-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-primary'>
                free
              </span>
              <span className='text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                To Start
              </span>
            </div>
          </div>
        </div>
      )}

      <section className='max-w-6xl mx-auto px-5 py-20'>
        <div className='mb-12 text-center'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3'>
            Everything you need
          </p>
          <h2 className='font-serif font-bold text-foreground text-3xl sm:text-4xl'>
            For the hobbyist who takes the craft seriously.
          </h2>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[
            {
              symbol: '◈',
              title: 'Watch Projects',
              desc: 'Log every movement on your bench. Status, service history, reference details, and photos — all in one place.',
            },
            {
              symbol: '◷',
              title: 'Repair Logs',
              desc: 'Document each bench session with notes, time spent, and what you actually did. Build a searchable history of your work.',
            },
            {
              symbol: '⊡',
              title: 'Parts Inventory',
              desc: "Know what's in your drawers before you order more. Track stems, crystals, mainsprings, and anything else you keep in stock.",
            },
            {
              symbol: '⚙',
              title: 'Tool Log',
              desc: 'Catalogue your bench setup from your staking set to your movement holder. Know exactly what you have.',
            },
            {
              symbol: '◎',
              title: 'Public Profile',
              desc: 'Share your work with the community. Your own subdomain with your repair posts and watch portfolio.',
            },
            {
              symbol: '⊞',
              title: 'Bench Overview',
              desc: 'All your active projects, recent sessions, and low-stock parts at a glance. Your whole hobby in one dashboard.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className='bg-card border border-border rounded-lg p-6 group hover:border-primary/30 transition-colors'
            >
              <div className='flex items-center gap-3 mb-3'>
                <span className='font-mono text-lg text-primary group-hover:scale-110 transition-transform inline-block'>
                  {f.symbol}
                </span>
                <span className='font-serif font-semibold text-foreground text-base'>
                  {f.title}
                </span>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className='max-w-3xl mx-auto px-5 my-8'>
        <div className='bg-card border-l-2 border-primary pl-8 pr-8 py-8'>
          <p className='font-serif text-xl sm:text-2xl text-foreground leading-relaxed italic'>
            &ldquo;Built for people who&apos;d rather be at the bench than on a
            spreadsheet &mdash; and who have more movements in ziplock bags than
            they&apos;d like to admit.&rdquo;
          </p>
          <p className='font-mono text-xs text-muted-foreground mt-5 uppercase tracking-widest'>
            &mdash; Hairspring
          </p>
        </div>
      </div>

      <section className='max-w-6xl mx-auto px-5 py-20'>
        <div className='mb-12 text-center'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3'>
            Simple by design
          </p>
          <h2 className='font-serif font-bold text-foreground text-3xl sm:text-4xl'>
            Up and running in under five minutes.
          </h2>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto'>
          {[
            {
              n: '01',
              title: 'Add a project',
              desc: "Log the watch: make, model, movement, reference, and what you're trying to accomplish. Attach photos straight from your phone.",
            },
            {
              n: '02',
              title: 'Document the work',
              desc: 'Write up each bench session, record parts used, and photograph the movement as you go. Every job, searchable later.',
            },
            {
              n: '03',
              title: 'Build your archive',
              desc: 'Watch your repair history grow. Refer back to old notes, track patterns across similar movements, and share your best work.',
            },
          ].map((step) => (
            <div key={step.n} className='flex flex-col gap-3'>
              <span className='font-mono text-4xl font-bold text-muted-foreground leading-none'>
                {step.n}
              </span>
              <div className='w-8 h-px bg-primary' />
              <h3 className='font-serif font-semibold text-foreground text-lg'>
                {step.title}
              </h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className='px-5 my-8'>
        <div className='bg-card rounded-2xl p-10 sm:p-14 mx-auto max-w-2xl text-center border border-border'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-primary mb-4'>
            Free to start
          </p>
          <h2 className='font-serif font-bold text-foreground text-3xl sm:text-4xl mb-3'>
            Ready to bring order to the bench?
          </h2>
          <p className='text-muted-foreground text-base mb-8'>
            Free to use. No credit card required.
          </p>
          <Link
            to='/signup'
            className='inline-block font-mono text-sm bg-primary text-primary-foreground font-bold px-10 py-3.5 rounded hover:bg-primary/90 transition-colors'
            onClick={trackCta}
          >
            Claim yourname.hairspring.app →
          </Link>
        </div>
      </div>

      <footer className='max-w-6xl mx-auto px-5 py-10 mt-8 border-t border-border'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-3'>
          <div className='flex items-center gap-4'>
            <span className='font-serif font-bold text-muted-foreground text-sm'>
              Hairspring
            </span>
            <span className='font-mono text-xs text-muted-foreground'>
              &copy; {new Date().getFullYear()} · Built for bench hobbyists.
            </span>
          </div>
          <div className='flex items-center gap-5'>
            <Link
              to='/login'
              className='font-mono text-xs text-muted-foreground hover:text-foreground transition-colors'
            >
              Sign in
            </Link>
            <Link
              to='/signup'
              className='font-mono text-xs text-muted-foreground hover:text-foreground transition-colors'
              onClick={trackCta}
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
