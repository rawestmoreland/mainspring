import { Link } from '@tanstack/react-router';
import { ArrowRightIcon, XIcon } from 'lucide-react';
import { format } from 'date-fns/format';
import { capitalize } from 'lodash-es';

import { cn, fmt, fmtPct, profit, roi } from '#/lib/helpers';
import type { Watch } from '#/types';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { StatusPicker } from '#/components/watches/StatusPicker';
import { useUser } from '#/hooks/user';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet';

type WatchDetailPanelProps = {
  watch: Watch | null;
  open: boolean;
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

export function WatchDetailPanel({ watch, open, onClose }: WatchDetailPanelProps) {
  const { data: user } = useUser();

  const p = watch ? profit(watch) : null;
  const r = watch ? roi(watch) : null;
  const firstPhoto = watch?.photos?.[0];

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[340px] sm:max-w-[340px] p-0 gap-0 overflow-y-auto"
      >
        {watch && (
          <>
            <SheetHeader className="px-4 py-3 border-b border-border sticky top-0 bg-popover z-10 gap-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <SheetTitle className="font-serif font-semibold text-foreground text-base leading-tight">
                    {watch.make} {watch.model}
                  </SheetTitle>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                    {watch.reference} · {watch.year}
                  </p>
                </div>
                <SheetClose asChild>
                  <button
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0.5 mt-0.5"
                    aria-label="Close panel"
                  >
                    <XIcon className="size-4" />
                  </button>
                </SheetClose>
              </div>
            </SheetHeader>

            <div className="px-4 py-2.5 border-b border-border">
              {user ? (
                <StatusPicker watch={watch} />
              ) : (
                <StatusBadge status={watch.status} />
              )}
            </div>

            {firstPhoto ? (
              <img
                src={firstPhoto.image}
                alt=""
                className="w-full aspect-video object-cover border-b border-border"
              />
            ) : (
              <div className="aspect-video bg-zinc-950 flex items-center justify-center border-b border-border">
                {/* text-muted-foreground on zinc-950: 6.2:1 */}
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  No photos
                </span>
              </div>
            )}

            <div className="divide-y divide-border">
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
                    <span className={cn(p >= 0 ? 'text-forest' : 'text-wax')}>
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
                        parseFloat(r) >= 0 ? 'text-forest' : 'text-wax',
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

            <SheetFooter className="px-4 py-3 border-t border-border">
              <Link
                to="/watches/$watchId"
                params={{ watchId: watch.id }}
                className="flex items-center justify-between text-xs font-mono text-primary hover:text-primary/80 no-underline group w-full"
              >
                <span>Open full page</span>
                <ArrowRightIcon className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
