import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LockIcon } from 'lucide-react';
import { format } from 'date-fns/format';
import {
  useWishlist,
  useCreateWishlistItem,
  useUpdateWishlistItem,
  useDeleteWishlistItem,
} from '#/hooks/wishlist';
import { useUser } from '#/hooks/user';
import { useSubscription } from '#/hooks/subscription';
import { UpgradeButton } from '#/components/primitives/UpgradeButton';
import { KpiCard } from '#/components/primitives/KpiCard';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { Field, FieldError, FieldLabel } from '#/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog';
import { Input } from '#/components/ui/input';
import { cn, fmt } from '#/lib/helpers';
import type {
  WishlistItem,
  WishlistPriority,
  WishlistStatus,
} from '#/types';

export const Route = createFileRoute('/wishlist')({
  component: WishlistPage,
});

const PRIORITY_LABELS: Record<WishlistPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const STATUS_LABELS: Record<WishlistStatus, string> = {
  wanted: 'Wanted',
  watching: 'Watching',
  acquired: 'Acquired',
};

const WISHLIST_STATUSES: WishlistStatus[] = ['wanted', 'watching', 'acquired'];

function WishlistStatusPicker({ item }: { item: WishlistItem }) {
  const [open, setOpen] = useState(false);
  const updateItem = useUpdateWishlistItem();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-75 bg-transparent',
            statusClass(item.status),
          )}
        >
          {STATUS_LABELS[item.status]}
        </button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-xs'>
        <DialogHeader>
          <DialogTitle className='font-mono text-sm font-medium'>
            Update Status
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-1.5 py-1'>
          {WISHLIST_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                updateItem.mutate({ id: item.id, data: { status: s } });
                setOpen(false);
              }}
              disabled={updateItem.isPending || item.status === s}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors cursor-pointer bg-transparent',
                item.status === s
                  ? 'border-amber-500/40 bg-amber-500/5 cursor-default'
                  : 'border-border hover:bg-white/5',
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest',
                  statusClass(s),
                )}
              >
                {STATUS_LABELS[s]}
              </span>
              {item.status === s && (
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

function priorityClass(priority: WishlistPriority): string {
  if (priority === 'high') return 'bg-red-500/15 text-red-400 border-red-500/30';
  if (priority === 'medium') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
}

function statusClass(status: WishlistStatus): string {
  if (status === 'wanted') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  if (status === 'watching') return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  return 'bg-green-500/15 text-green-400 border-green-500/30';
}

const schema = z.object({
  make: z.string().min(1, 'Required'),
  model: z.string().min(1, 'Required'),
  reference: z.string().optional(),
  target_price: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

const FILTER_TABS: { id: WishlistStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'wanted', label: 'Wanted' },
  { id: 'watching', label: 'Watching' },
  { id: 'acquired', label: 'Acquired' },
];

function AddWatchForm({
  userId,
  onSuccess,
  onCancel,
}: {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const createItem = useCreateWishlistItem();
  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
  });

  const onSubmit = async (data: FormData) => {
    await createItem.mutateAsync({
      user: userId,
      make: data.make,
      model: data.model,
      reference: data.reference || undefined,
      target_price: data.target_price ? parseFloat(data.target_price) : undefined,
      priority: data.priority,
      notes: data.notes || undefined,
      status: 'wanted',
    });
    reset();
    onSuccess();
  };

  const inputCls =
    'w-full rounded border border-input bg-background px-2.5 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
        <div>
          <Controller
            name='make'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='make'>Make</FieldLabel>
                <Input
                  {...field}
                  id='make'
                  placeholder='e.g. Omega'
                  aria-invalid={fieldState.invalid}
                  className={inputCls}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div>
          <Controller
            name='model'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='model'>Model</FieldLabel>
                <Input
                  {...field}
                  id='model'
                  placeholder='e.g. Seamaster 300'
                  aria-invalid={fieldState.invalid}
                  className={inputCls}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div>
          <Controller
            name='reference'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='reference'>Reference</FieldLabel>
                <Input
                  {...field}
                  id='reference'
                  placeholder='Optional'
                  aria-invalid={fieldState.invalid}
                  className={inputCls}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div>
          <Controller
            name='target_price'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='target_price'>Target Price</FieldLabel>
                <Input
                  {...field}
                  id='target_price'
                  type='number'
                  step='0.01'
                  placeholder='Optional'
                  aria-invalid={fieldState.invalid}
                  className={inputCls}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
        <div>
          <Controller
            name='priority'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='priority'>Priority</FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id='priority' className={inputCls}>
                    <SelectValue placeholder='Priority' />
                  </SelectTrigger>
                  <SelectContent position='popper'>
                    <SelectItem value='high'>High</SelectItem>
                    <SelectItem value='medium'>Medium</SelectItem>
                    <SelectItem value='low'>Low</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div className='sm:col-span-3'>
          <Controller
            name='notes'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='notes'>Notes</FieldLabel>
                <Input
                  {...field}
                  id='notes'
                  placeholder='Optional — source, condition notes, price range…'
                  aria-invalid={fieldState.invalid}
                  className={inputCls}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </div>
      <div className='flex gap-3'>
        <button
          type='submit'
          disabled={createItem.isPending}
          className='inline-flex items-center rounded-md bg-primary px-4 py-2 text-xs font-mono text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity'
        >
          {createItem.isPending ? 'Adding…' : 'Add Watch'}
        </button>
        <button
          type='button'
          onClick={onCancel}
          className='inline-flex items-center rounded-md border border-border px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors bg-transparent cursor-pointer'
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function WishlistPage() {
  const { data: items = [], isLoading } = useWishlist();
  const { data: user } = useUser();
  const { isPro } = useSubscription();
  const deleteItem = useDeleteWishlistItem();

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<WishlistStatus | 'all'>('all');

  if (!isPro) {
    return (
      <div className='flex flex-col items-center justify-center py-20'>
        <div className='flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-10 py-14 text-center max-w-sm w-full'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10'>
            <LockIcon className='h-5 w-5 text-amber-400' />
          </div>
          <div className='space-y-1'>
            <h2 className='font-serif font-semibold text-foreground'>
              Watch Wishlist
            </h2>
            <p className='font-mono text-xs text-muted-foreground max-w-xs'>
              Track watches you want to acquire and restore. Set price targets,
              add notes, and keep your pipeline organized.
            </p>
          </div>
          {user && <UpgradeButton pbUserId={user.id} />}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='text-sm font-mono text-muted-foreground'>Loading…</div>
    );
  }

  const wanted = items.filter((i) => i.status === 'wanted').length;
  const watching = items.filter((i) => i.status === 'watching').length;
  const acquired = items.filter((i) => i.status === 'acquired').length;
  const totalTarget = items
    .filter((i) => i.status !== 'acquired' && i.target_price != null)
    .reduce((sum, i) => sum + (i.target_price ?? 0), 0);

  const displayed =
    filter === 'all' ? items : items.filter((i) => i.status === filter);

  return (
    <div className='space-y-5 min-w-0'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-serif font-semibold text-foreground'>
            Wishlist
          </h1>
          <p className='mt-0.5 font-mono text-[11px] text-muted-foreground'>
            Watches you want to acquire and restore
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className='inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-mono text-primary-foreground hover:opacity-90 transition-opacity'
          >
            + Add Watch
          </button>
        )}
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        <KpiCard highlight label='Wanted' value={wanted} sub='target acquisitions' />
        <KpiCard label='Watching' value={watching} sub='monitoring price' />
        <KpiCard label='Acquired' value={acquired} sub='secured' />
        <KpiCard
          label='Target Spend'
          value={fmt(totalTarget)}
          sub='estimated pipeline cost'
        />
      </div>

      {showForm && user && (
        <div className='rounded-xl border border-border bg-card p-5'>
          <SectionLabel>New Wishlist Entry</SectionLabel>
          <div className='mt-3'>
            <AddWatchForm
              userId={user.id}
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className='flex gap-1.5 flex-wrap'>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              'rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors cursor-pointer bg-transparent',
              filter === tab.id
                ? 'border-primary text-primary'
                : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className='ml-1 opacity-60'>
                ({items.filter((i) => i.status === tab.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div>
        <SectionLabel>
          {filter === 'all' ? 'All Watches' : STATUS_LABELS[filter as WishlistStatus]}
          {' · '}
          {displayed.length}
          {displayed.length === 1 ? ' watch' : ' watches'}
        </SectionLabel>
        <div className='mt-3'>
          {displayed.length === 0 ? (
            <div className='rounded-xl border border-border bg-card px-5 py-8 text-center font-mono text-xs text-muted-foreground'>
              {filter === 'all' ? (
                <>
                  No watches on your wishlist yet.{' '}
                  {user && (
                    <button
                      onClick={() => setShowForm(true)}
                      className='text-primary hover:text-primary/80 bg-transparent border-none cursor-pointer font-mono text-xs p-0'
                    >
                      Add the first one →
                    </button>
                  )}
                </>
              ) : (
                `No ${STATUS_LABELS[filter as WishlistStatus].toLowerCase()} watches.`
              )}
            </div>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Watch</Th>
                  <Th>Reference</Th>
                  <Th>Priority</Th>
                  <Th>Target Price</Th>
                  <Th>Notes</Th>
                  <Th>Added</Th>
                  <Th>Status</Th>
                  {user && <Th>{''}</Th>}
                </tr>
              </thead>
              <tbody>
                {displayed.map((item) => (
                  <TableRow key={item.id}>
                    <Td className='font-mono text-[11px] text-foreground font-medium'>
                      {item.make} {item.model}
                    </Td>
                    <Td className='font-mono text-[11px] text-muted-foreground'>
                      {item.reference ?? '—'}
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest',
                          priorityClass(item.priority),
                        )}
                      >
                        {PRIORITY_LABELS[item.priority]}
                      </span>
                    </Td>
                    <Td className='font-mono text-[11px] text-foreground'>
                      {item.target_price != null ? fmt(item.target_price) : '—'}
                    </Td>
                    <Td className='font-mono text-[11px] text-muted-foreground max-w-48 truncate'>
                      {item.notes ?? '—'}
                    </Td>
                    <Td className='font-mono text-[11px] text-muted-foreground'>
                      {format(new Date(item.created), 'MMM d, yyyy')}
                    </Td>
                    <Td>
                      <WishlistStatusPicker item={item} />
                    </Td>
                    {user && (
                      <Td>
                        <button
                          onClick={() => {
                            if (confirm('Remove from wishlist?')) {
                              deleteItem.mutate(item.id);
                            }
                          }}
                          className='text-muted-foreground hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer text-base leading-none p-0'
                          aria-label='Delete item'
                        >
                          ×
                        </button>
                      </Td>
                    )}
                  </TableRow>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>
      </div>
    </div>
  );
}
