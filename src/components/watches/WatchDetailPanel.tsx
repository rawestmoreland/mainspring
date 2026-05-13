import { Link } from '@tanstack/react-router';
import { XIcon, ArrowRightIcon, ChevronLeftIcon } from 'lucide-react';
import { format } from 'date-fns/format';
import { capitalize } from 'lodash-es';

import { cn, fmt, fmtPct, profit, roi } from '#/lib/helpers';
import type { Watch } from '#/types';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { StatusPicker } from '#/components/watches/StatusPicker';
import { useUser } from '#/hooks/user';
import { useIsMobile } from '#/hooks/use-mobile';

type WatchDetailPanelProps = {
  watch: Watch;
  onClose: () => void;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center px-4 py-2 hover:bg-black/[0.03] transition-colors gap-4">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </span>
      <span className="font-mono text-[11px] text-foreground text-right">
        {value}
      </span>
    </div>
  );
}

type PanelContentProps = {
  watch: Watch;
  onClose: () => void;
  isMobile: boolean;
};

function PanelContent({ watch, onClose, isMobile }: PanelContentProps) {
  const { data: user } = useUser();
  const p = profit(watch);
  const r = roi(watch);
  const firstPhoto = watch.photos?.[0];

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-border gap-3 sticky top-0 bg-background z-10">
        {isMobile ? (
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0 shrink-0 mt-0.5"
          >
            <ChevronLeftIcon className="size-3.5" />
            Back
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="font-serif font-semibold text-foreground text-base leading-tight">
            {watch.make} {watch.model}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
            {watch.reference} · {watch.year}
          </div>
        </div>
        {!isMobile ? (
          <button
            onClick={onClose}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0.5 mt-0.5"
            aria-label="Close panel"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Status */}
      <div className="px-4 py-2.5 border-b border-border">
        {user ? (
          <StatusPicker watch={watch} />
        ) : (
          <StatusBadge status={watch.status} />
        )}
      </div>

      {/* Photo */}
      {firstPhoto ? (
        <img
          src={firstPhoto.image}
          alt=""
          className={cn(
            'w-full object-cover border-b border-border',
            isMobile ? 'max-h-56' : 'aspect-video',
          )}
        />
      ) : (
        <div
          className={cn(
            'bg-zinc-950 flex items-center justify-center border-b border-border',
            isMobile ? 'h-32' : 'aspect-video',
          )}
        >
          {/* text-muted-foreground at full opacity on zinc-950: 6.2:1 */}
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            No photos
          </span>
        </div>
      )}

      {/* Data rows */}
      <div className="divide-y divide-border flex-1">
        <Row
          label="Condition"
          value={capitalize(watch.condition_bought?.replace('_', ' '))}
        />
        <Row label="Paid" value={fmt(watch.bought_price)} />
        <Row label="Parts" value={fmt(watch.parts_cost)} />
        <Row
          label="Total Invested"
          value={fmt(watch.bought_price + (watch.parts_cost ?? 0))}
        />
        <Row label="Sold For" value={fmt(watch.sold_price)} />
        <Row
          label="Profit"
          value={
            p !== null ? (
              <span className={cn(p >= 0 ? 'text-green-400' : 'text-red-400')}>
                {fmt(p)}
              </span>
            ) : (
              '—'
            )
          }
        />
        <Row
          label="ROI"
          value={
            r !== null ? (
              <span
                className={cn(
                  parseFloat(r) >= 0 ? 'text-green-400' : 'text-red-400',
                )}
              >
                {fmtPct(r)}
              </span>
            ) : (
              '—'
            )
          }
        />
        <Row label="Hours" value={`${watch.hours_spent ?? 0}h`} />
        <Row
          label="Acquired"
          value={
            watch.bought_date
              ? format(watch.bought_date, 'MMM d, yyyy')
              : '—'
          }
        />
        {watch.sold_date && (
          <Row label="Sold" value={format(watch.sold_date, 'MMM d, yyyy')} />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <Link
          to="/watches/$watchId"
          params={{ watchId: watch.id }}
          className="flex items-center justify-between text-xs font-mono text-primary hover:text-primary/80 no-underline group"
        >
          <span>Open full page</span>
          <ArrowRightIcon className="size-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </>
  );
}

export function WatchDetailPanel({ watch, onClose }: WatchDetailPanelProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={onClose}
        />
        <div className="fixed inset-x-0 top-14 bottom-0 z-50 bg-background overflow-y-auto flex flex-col">
          <PanelContent watch={watch} onClose={onClose} isMobile={true} />
        </div>
      </>
    );
  }

  return (
    <div className="w-[320px] shrink-0 border-l border-border bg-background self-start sticky top-0 max-h-[calc(100vh-7rem)] overflow-y-auto flex flex-col rounded-xl">
      <PanelContent watch={watch} onClose={onClose} isMobile={false} />
    </div>
  );
}
