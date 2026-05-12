import { Link } from '@tanstack/react-router';
import { XIcon, ArrowRightIcon } from 'lucide-react';
import { format } from 'date-fns/format';
import { capitalize } from 'lodash-es';

import { cn, fmt, fmtPct, profit, roi } from '#/lib/helpers';
import type { Watch } from '#/types';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { StatusPicker } from '#/components/watches/StatusPicker';
import { useUser } from '#/hooks/user';

type WatchDetailPanelProps = {
  watch: Watch;
  onClose: () => void;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center px-4 py-2 hover:bg-white/2 transition-colors gap-4">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </span>
      <span className="font-mono text-[11px] text-foreground text-right">
        {value}
      </span>
    </div>
  );
}

export function WatchDetailPanel({ watch, onClose }: WatchDetailPanelProps) {
  const { data: user } = useUser();
  const p = profit(watch);
  const r = roi(watch);
  const firstPhoto = watch.photos?.[0];

  return (
    <div className="w-[320px] shrink-0 border-l border-border bg-background self-start sticky top-0 max-h-[calc(100vh-7rem)] overflow-y-auto flex flex-col rounded-xl">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-border gap-3 sticky top-0 bg-background z-10">
        <div className="min-w-0">
          <div className="font-serif font-semibold text-foreground text-base leading-tight">
            {watch.make} {watch.model}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
            {watch.reference} · {watch.year}
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0.5 mt-0.5"
          aria-label="Close panel"
        >
          <XIcon className="size-4" />
        </button>
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
          className="w-full aspect-video object-cover border-b border-border"
        />
      ) : (
        <div className="aspect-video bg-zinc-950 flex items-center justify-center border-b border-border">
          <span className="font-mono text-[9px] text-muted-foreground/25 uppercase tracking-widest">
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
          <Row
            label="Sold"
            value={format(watch.sold_date, 'MMM d, yyyy')}
          />
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
    </div>
  );
}
