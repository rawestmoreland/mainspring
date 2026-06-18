import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

const HOUR_MARKERS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i * 30 * Math.PI) / 180;
  return {
    x1: 100 + 79 * Math.sin(angle),
    y1: 100 - 79 * Math.cos(angle),
    x2: 100 + 88 * Math.sin(angle),
    y2: 100 - 88 * Math.cos(angle),
  };
});

const MINUTE_MARKERS = Array.from({ length: 60 }, (_, i) => {
  if (i % 5 === 0) return null;
  const angle = (i * 6 * Math.PI) / 180;
  return {
    x1: 100 + 84 * Math.sin(angle),
    y1: 100 - 84 * Math.cos(angle),
    x2: 100 + 88 * Math.sin(angle),
    y2: 100 - 88 * Math.cos(angle),
  };
}).filter((m): m is NonNullable<typeof m> => m !== null);

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className='fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-8'>
      {/* eslint-disable-next-line i18next/no-literal-string */}
      <p className='font-mono text-[10px] tracking-[0.32em] uppercase text-primary opacity-70 mb-8'>Ref. 404</p>

      <svg
        viewBox='0 0 200 200'
        width='220'
        height='220'
        className='mb-9'
        aria-hidden='true'
      >
        {/* Bezel */}
        <circle
          cx='100'
          cy='100'
          r='93'
          stroke='var(--ink-ghost)'
          strokeWidth='0.4'
          fill='none'
        />
        <circle
          cx='100'
          cy='100'
          r='90'
          stroke='var(--ink-ghost)'
          strokeWidth='0.2'
          fill='none'
        />

        {/* Chapter ring — hour markers */}
        {HOUR_MARKERS.map((m, i) => (
          <line
            key={`h${i}`}
            {...m}
            stroke='var(--brass)'
            strokeWidth='1.4'
            opacity='0.4'
          />
        ))}

        {/* Chapter ring — minute markers */}
        {MINUTE_MARKERS.map((m, i) => (
          <line
            key={`m${i}`}
            {...m}
            stroke='var(--brass)'
            strokeWidth='0.5'
            opacity='0.2'
          />
        ))}

        {/* Inner dial ring */}
        <circle
          cx='100'
          cy='100'
          r='76'
          stroke='var(--rule)'
          strokeWidth='0.5'
          fill='none'
          opacity='0.6'
        />

        {/* Hairspring spiral — slowly rotating */}
        <g className='hairspring-spiral'>
          {/* Scale 32×32 source (center 16,16) → 4.5× → center 100,100 */}
          <g transform='translate(28 28) scale(4.5)'>
            <path
              d='M16 16 m 0 0 a 1 1 0 0 1 1 0 a 2.2 2.2 0 0 1 0 3.2 a 4 4 0 0 1 -5.6 -0.4 a 6 6 0 0 1 0.6 -8.4 a 8 8 0 0 1 11 0.6 a 10.5 10.5 0 0 1 -0.7 14.4'
              stroke='var(--brass)'
              strokeWidth='0.32'
              strokeLinecap='round'
              fill='none'
            />
            <circle cx='16' cy='16' r='0.22' fill='var(--brass)' />
          </g>
        </g>

        {/* Center pivot jewel */}
        <circle cx='100' cy='100' r='2.8' fill='var(--brass)' opacity='0.45' />
        <circle cx='100' cy='100' r='1.3' fill='var(--paper)' />
      </svg>

      {/* Ornamental rule */}
      <div className='flex items-center gap-3 w-44 mb-7'>
        <span className='flex-1 h-px bg-(--rule)' />
        <span className='w-1.25 h-1.25 border border-brass rotate-45 opacity-[0.45] shrink-0' />
        <span className='flex-1 h-px bg-(--rule)' />
      </div>

      <h1 className='font-serif text-[clamp(1.4rem,3.5vw,1.875rem)] font-semibold text-foreground text-center mb-3 tracking-[-0.01em] leading-[1.2]'>
        {t('notFoundTitle')}
      </h1>

      <p className='font-sans italic text-sm text-muted-foreground text-center leading-7 max-w-88 mb-10 tracking-[0.01em]'>
        {t('notFoundBody')}
      </p>

      <Link
        to='/dashboard'
        className='font-mono text-[11px] tracking-[0.2em] uppercase text-primary no-underline opacity-75 border-b border-brass-light pb-0.5 transition-opacity duration-150 hover:opacity-100 hover:text-primary'
      >
        {t('notFoundReturn')}
      </Link>

      {/* eslint-disable-next-line i18next/no-literal-string */}
      <p className='absolute bottom-6 font-mono text-[9px] tracking-[0.18em] text-(--ink-ghost) uppercase'>Hairspring · ERR–404</p>
    </div>
  );
}
