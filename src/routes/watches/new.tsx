'use client';

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateWatch, WatchCondition, WatchStatus } from '#/types';
import { numberField } from '#/lib/helpers';
import { useCreateWatch } from '#/hooks/watches';
import { useUser } from '#/hooks/user';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '#/components/ui/field';
import { Input } from '#/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { Button } from '#/components/ui/button';

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

const formSchema = z.object({
  make: z.string().trim().min(1, 'Make is required'),
  model: z.string().trim().min(1, 'Model is required'),
  reference: z.string().trim().optional(),
  year: numberField({ min: 1, message: 'Year is required' }).pipe(
    z.number().int(),
  ),
  status: z.enum(WATCH_STATUSES),
  condition_bought: z.enum(WATCH_CONDITIONS),
  bought_price: numberField({
    min: 0,
    message: 'Bought price must be 0 or more',
  }),
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

  const { data: user, isLoading: isUserLoading } = useUser();

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
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Unauthorized</div>;
  }

  const onSubmit = handleSubmit(async (raw) => {
    setSubmitError(null);

    const parsed = formSchema.safeParse(raw);
    if (!parsed.success) return;

    const payload: CreateWatch = {
      ...parsed.data,
      reference: parsed.data.reference?.trim() ?? '',
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
          <Controller
            name='make'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='make'>Make</FieldLabel>
                <Input
                  {...field}
                  id='make'
                  autoFocus
                  aria-invalid={fieldState.invalid}
                  placeholder='Rolex'
                  autoComplete='off'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='model'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='model'>Model</FieldLabel>
                <Input
                  {...field}
                  id='model'
                  aria-invalid={fieldState.invalid}
                  placeholder='Submariner'
                  autoComplete='off'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='reference'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='reference'>Reference</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  id='reference'
                  aria-invalid={fieldState.invalid}
                  placeholder='16610'
                  autoComplete='off'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='year'
            control={control}
            render={({ field: { onChange, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='year'>Year</FieldLabel>
                <Input
                  {...field}
                  id='year'
                  type='number'
                  inputMode='numeric'
                  aria-invalid={fieldState.invalid}
                  autoComplete='off'
                  onChange={(e) => onChange(e.target.valueAsNumber)}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </section>

        <section className='grid grid-cols-2 gap-4'>
          <Controller
            name='status'
            control={control}
            render={({ fieldState, field }) => (
              <Field orientation='responsive' data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor='status'>Status</FieldLabel>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id='status'
                    aria-invalid={fieldState.invalid}
                    className='min-w-30'
                  >
                    <SelectValue placeholder='select' />
                  </SelectTrigger>
                  <SelectContent position='item-aligned'>
                    {WATCH_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name='condition_bought'
            control={control}
            render={({ fieldState, field }) => (
              <Field orientation='responsive' data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor='condition_bought'>
                    Condition (bought)
                  </FieldLabel>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id='condition_bought'
                    aria-invalid={fieldState.invalid}
                    className='min-w-30'
                  >
                    <SelectValue placeholder='select' />
                  </SelectTrigger>
                  <SelectContent position='item-aligned'>
                    {WATCH_CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </section>

        <section className='grid grid-cols-3 gap-4'>
          <Controller
            name='bought_price'
            control={control}
            render={({ field: { onChange, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='bought_price'>Bought price</FieldLabel>
                <Input
                  {...field}
                  id='bought_price'
                  type='number'
                  inputMode='decimal'
                  step='any'
                  aria-invalid={fieldState.invalid}
                  autoComplete='off'
                  onChange={(e) => onChange(e.target.valueAsNumber)}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='parts_cost'
            control={control}
            render={({ field: { onChange, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='parts_cost'>Parts cost</FieldLabel>
                <Input
                  {...field}
                  id='parts_cost'
                  type='number'
                  inputMode='decimal'
                  step='any'
                  aria-invalid={fieldState.invalid}
                  autoComplete='off'
                  onChange={(e) => onChange(e.target.valueAsNumber)}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='hours_spent'
            control={control}
            render={({ field: { onChange, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='hours_spent'>Hours spent</FieldLabel>
                <Input
                  {...field}
                  id='hours_spent'
                  type='number'
                  inputMode='decimal'
                  step='0.25'
                  aria-invalid={fieldState.invalid}
                  autoComplete='off'
                  onChange={(e) => onChange(e.target.valueAsNumber)}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </section>

        <section className='grid grid-cols-2 gap-4'>
          <Controller
            name='bought_date'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='bought_date'>Bought date</FieldLabel>
                <Input
                  {...field}
                  id='bought_date'
                  type='date'
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='sold_date'
            control={control}
            render={({ field: { onChange, value, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='sold_date'>
                  Sold date (optional)
                </FieldLabel>
                <Input
                  {...field}
                  value={value ?? ''}
                  id='sold_date'
                  type='date'
                  aria-invalid={fieldState.invalid}
                  onChange={(e) => onChange(e.target.value || null)}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </section>

        <section className='grid grid-cols-2 gap-4'>
          <Controller
            name='sold_price'
            control={control}
            render={({ field: { onChange, value, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='sold_price'>
                  Sold price (optional)
                </FieldLabel>
                <Input
                  {...field}
                  value={(value as number | null) ?? ''}
                  id='sold_price'
                  type='number'
                  inputMode='decimal'
                  step='any'
                  aria-invalid={fieldState.invalid}
                  autoComplete='off'
                  onChange={(e) =>
                    onChange(
                      e.target.value === '' ? null : e.target.valueAsNumber,
                    )
                  }
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='notes'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='notes'>Notes</FieldLabel>
                <textarea
                  {...field}
                  id='notes'
                  rows={4}
                  aria-invalid={fieldState.invalid}
                  placeholder='Anything worth remembering…'
                  className='w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </section>

        <div className='flex items-center gap-2 pt-2'>
          <Button
            type='submit'
            disabled={isSubmitting || createWatch.isPending}
          >
            {createWatch.isPending ? 'Creating…' : 'Create watch'}
          </Button>
          <Button asChild variant='outline'>
            <Link to='/watches'>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
