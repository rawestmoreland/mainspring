import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateWatch, WatchCondition, WatchStatus } from '#/types';
import { Btn } from '#/components/primitives/Button';
import { cn } from '#/lib/helpers';
import { useCreateWatch } from '#/hooks/watches';

export const Route = createFileRoute('/watches/new')({
  component: NewWatchRoute,
});

const WATCH_STATUSES: readonly WatchStatus[] = [
  'acquired',
  'in_progress',
  'listed',
  'sold',
] as const;

const WATCH_CONDITIONS: readonly WatchCondition[] = [
  'good',
  'fair',
  'poor',
  'worn',
  'parts_only',
] as const;

const numberField = (opts?: { min?: number; message?: string }) =>
  z.preprocess(
    (v) => {
      if (v === '' || v === null || typeof v === 'undefined') return NaN;
      const n = typeof v === 'number' ? v : Number(v);
      return n;
    },
    (opts?.min ?? 0) > 0
      ? z.number().min(opts!.min!, opts!.message)
      : z.number().min(0, opts?.message),
  );

const formSchema = z.object({
  make: z.string().trim().min(1, 'Make is required'),
  model: z.string().trim().min(1, 'Model is required'),
  reference: z.string().trim().min(1, 'Reference is required'),
  year: numberField({ min: 1, message: 'Year is required' }).pipe(z.number().int()),
  status: z.enum(WATCH_STATUSES),
  condition_bought: z.enum(WATCH_CONDITIONS),
  bought_price: numberField({ min: 0, message: 'Bought price must be 0 or more' }),
  parts_cost: numberField({ min: 0, message: 'Parts cost must be 0 or more' }),
  hours_spent: numberField({ min: 0, message: 'Hours must be 0 or more' }),
  bought_date: z.string().trim().min(1, 'Bought date is required'),
  sold_price: z.preprocess((v) => {
    if (v === '' || v === null || typeof v === 'undefined') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isNaN(n) ? NaN : n;
  }, z.number().min(0).nullable()),
  sold_date: z.string().trim().nullable(),
  notes: z.string(),
});

type FormValues = z.input<typeof formSchema>;

function NewWatchRoute() {
  const navigate = useNavigate();
  const createWatch = useCreateWatch();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues = useMemo<FormValues>(
    () => ({
      make: '',
      model: '',
      reference: '',
      year: new Date().getFullYear(),
      status: 'in_progress',
      condition_bought: 'good',
      bought_price: 0,
      parts_cost: 0,
      hours_spent: 0,
      bought_date: '',
      sold_price: null,
      sold_date: null,
      notes: '',
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (raw) => {
    setSubmitError(null);

    const parsed = formSchema.safeParse(raw);
    if (!parsed.success) return;

    const payload: CreateWatch = {
      ...parsed.data,
      sold_date: parsed.data.sold_date?.trim() ? parsed.data.sold_date : null,
      notes: parsed.data.notes ?? '',
    };

    try {
      const created = await createWatch.mutateAsync(payload);
      navigate({
        to: '/watches/$watchId',
        params: { watchId: created.id },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create watch.';
      setSubmitError(msg);
    }
  });

  const inputBase =
    'w-full rounded-md bg-background border border-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50';

  const labelBase =
    'text-[10px] uppercase tracking-widest font-mono text-muted-foreground';

  return (
    <div className='max-w-3xl'>
      <div className='mb-6'>
        <Link
          to='/watches'
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          ← Back to Watches
        </Link>
        <h1 className='mt-3 text-2xl font-serif font-semibold text-foreground'>
          Add Watch
        </h1>
        <p className='mt-1 text-xs font-mono text-muted-foreground tracking-wide'>
          Create a new watch record.
        </p>
      </div>

      {submitError && (
        <div
          role='alert'
          className='mb-4 rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300'
        >
          {submitError}
        </div>
      )}

      <form onSubmit={onSubmit} className='space-y-6'>
        <section className='grid grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <label className={labelBase} htmlFor='make'>
              Make
            </label>
            <input
              id='make'
              autoFocus
              className={cn(inputBase, errors.make && 'border-red-800')}
              {...register('make')}
              placeholder='Rolex'
            />
            {errors.make && (
              <div className='text-xs text-red-300'>{errors.make.message}</div>
            )}
          </div>

          <div className='space-y-1.5'>
            <label className={labelBase} htmlFor='model'>
              Model
            </label>
            <input
              id='model'
              className={cn(inputBase, errors.model && 'border-red-800')}
              {...register('model')}
              placeholder='Submariner'
            />
            {errors.model && (
              <div className='text-xs text-red-300'>{errors.model.message}</div>
            )}
          </div>

          <div className='space-y-1.5'>
            <label className={labelBase} htmlFor='reference'>
              Reference
            </label>
            <input
              id='reference'
              className={cn(inputBase, errors.reference && 'border-red-800')}
              {...register('reference')}
              placeholder='16610'
            />
            {errors.reference && (
              <div className='text-xs text-red-300'>
                {errors.reference.message}
              </div>
            )}
          </div>

          <div className='space-y-1.5'>
            <label className={labelBase} htmlFor='year'>
              Year
            </label>
            <input
              id='year'
              type='number'
              inputMode='numeric'
              className={cn(inputBase, errors.year && 'border-red-800')}
              {...register('year', { valueAsNumber: true })}
            />
            {errors.year && (
              <div className='text-xs text-red-300'>{errors.year.message}</div>
            )}
          </div>
        </section>

        <section className='grid grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <label className={labelBase} htmlFor='status'>
              Status
            </label>
            <select
              id='status'
              className={cn(inputBase, errors.status && 'border-red-800')}
              {...register('status')}
            >
              {WATCH_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
            {errors.status && (
              <div className='text-xs text-red-300'>
                {errors.status.message}
              </div>
            )}
          </div>

          <div className='space-y-1.5'>
            <label className={labelBase} htmlFor='condition_bought'>
              Condition (bought)
            </label>
            <select
              id='condition_bought'
              className={cn(inputBase, errors.condition_bought && 'border-red-800')}
              {...register('condition_bought')}
            >
              {WATCH_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </select>
            {errors.condition_bought && (
              <div className='text-xs text-red-300'>
                {errors.condition_bought.message}
              </div>
            )}
          </div>
        </section>

        <section className='grid grid-cols-3 gap-4'>
          <div className='space-y-1.5'>
            <label className={labelBase} htmlFor='bought_price'>
              Bought price
            </label>
            <input
              id='bought_price'
              type='number'
              inputMode='decimal'
              className={cn(inputBase, errors.bought_price && 'border-red-800')}
              {...register('bought_price', { valueAsNumber: true })}
            />
            {errors.bought_price && (
              <div className='text-xs text-red-300'>
                {errors.bought_price.message}
              </div>
            )}
          </div>

          <div className='space-y-1.5'>
            <label className={labelBase} htmlFor='parts_cost'>
              Parts cost
            </label>
            <input
              id='parts_cost'
              type='number'
              inputMode='decimal'
              className={cn(inputBase, errors.parts_cost && 'border-red-800')}
              {...register('parts_cost', { valueAsNumber: true })}
            />
            {errors.parts_cost && (
              <div className='text-xs text-red-300'>
                {errors.parts_cost.message}
              </div>
            )}
          </div>

          <div className='space-y-1.5'>
            <label className={labelBase} htmlFor='hours_spent'>
              Hours spent
            </label>
            <input
              id='hours_spent'
              type='number'
              inputMode='decimal'
              step='0.25'
              className={cn(inputBase, errors.hours_spent && 'border-red-800')}
              {...register('hours_spent', { valueAsNumber: true })}
            />
            {errors.hours_spent && (
              <div className='text-xs text-red-300'>
                {errors.hours_spent.message}
              </div>
            )}
          </div>
        </section>

        <section className='grid grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <label className={labelBase} htmlFor='bought_date'>
              Bought date
            </label>
            <input
              id='bought_date'
              type='date'
              className={cn(inputBase, errors.bought_date && 'border-red-800')}
              {...register('bought_date')}
            />
            {errors.bought_date && (
              <div className='text-xs text-red-300'>
                {errors.bought_date.message}
              </div>
            )}
          </div>

          <div className='space-y-1.5'>
            <label className={labelBase} htmlFor='sold_date'>
              Sold date (optional)
            </label>
            <input
              id='sold_date'
              type='date'
              className={cn(inputBase, errors.sold_date && 'border-red-800')}
              {...register('sold_date', {
                setValueAs: (v) => (typeof v === 'string' && v.trim() ? v : null),
              })}
            />
            {errors.sold_date && (
              <div className='text-xs text-red-300'>
                {errors.sold_date.message}
              </div>
            )}
          </div>
        </section>

        <section className='grid grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <label className={labelBase} htmlFor='sold_price'>
              Sold price (optional)
            </label>
            <input
              id='sold_price'
              type='number'
              inputMode='decimal'
              className={cn(inputBase, errors.sold_price && 'border-red-800')}
              {...register('sold_price', {
                setValueAs: (v) => (v === '' || v === null || typeof v === 'undefined' ? null : Number(v)),
              })}
            />
            {errors.sold_price && (
              <div className='text-xs text-red-300'>
                {errors.sold_price.message}
              </div>
            )}
          </div>

          <div className='space-y-1.5'>
            <label className={labelBase} htmlFor='notes'>
              Notes
            </label>
            <textarea
              id='notes'
              rows={4}
              className={cn(inputBase, 'resize-y', errors.notes && 'border-red-800')}
              {...register('notes')}
              placeholder='Anything worth remembering…'
            />
            {errors.notes && (
              <div className='text-xs text-red-300'>{errors.notes.message}</div>
            )}
          </div>
        </section>

        <div className='flex items-center gap-2 pt-2'>
          <Btn type='submit' disabled={isSubmitting || createWatch.isPending}>
            {createWatch.isPending ? 'Creating…' : 'Create watch'}
          </Btn>
          <Link to='/watches' className='inline-block'>
            <button
              type='button'
              className='rounded font-semibold tracking-wide transition-opacity hover:opacity-90 cursor-pointer bg-transparent text-muted-foreground border border-border hover:text-foreground hover:border-ring px-4 py-2 text-xs'
            >
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}

