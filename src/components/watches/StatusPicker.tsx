import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog';
import { cn } from '#/lib/helpers';
import { STATUS_META } from '#/lib/mocks/meta';
import { Watch, WatchStatus } from '#/types';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { useUpdateWatch } from '#/hooks/watches';

export function StatusPicker({ watch }: { watch: Watch }) {
  const [open, setOpen] = useState(false);
  const updateWatch = useUpdateWatch();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className='cursor-pointer bg-transparent border-none p-0'>
          <StatusBadge status={watch.status} />
        </button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-xs'>
        <DialogHeader>
          <DialogTitle className='font-mono text-sm font-medium'>
            Update Status
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-1.5 py-1'>
          {(Object.keys(STATUS_META) as WatchStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                updateWatch.mutate({ ...watch, status: s });
                setOpen(false);
              }}
              disabled={updateWatch.isPending || watch.status === s}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors cursor-pointer bg-transparent',
                watch.status === s
                  ? 'border-amber-500/40 bg-amber-500/5 cursor-default'
                  : 'border-border hover:bg-white/5',
              )}
            >
              <StatusBadge status={s} />
              {watch.status === s && (
                <span className='font-mono text-[10px] text-muted-foreground'>
                  current
                </span>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
