'use client';

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePostHog } from '@posthog/react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { WatchCondition, WatchStatus } from '#/types';
import { numberField } from '#/lib/helpers';
import { useGetWatchById, useUpdateWatch } from '#/hooks/watches';
import { useUser } from '#/hooks/user';
import { WatchesApi } from '#/lib/api/watches';
import { ImagePlusIcon } from 'lucide-react';
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
import TiptapEditor, { TiptapEditorRef } from '#/components/TipTap';

export const Route = createFileRoute('/watches/$watchId/edit')({
  component: EditWatchRoute,
});

const WATCH_STATUSES: readonly WatchStatus[] = [
  'acquired',
  'in_progress',
  'listed',
  'sold',
  'paused',
  'kept',
  'archived',
] as const;

const WATCH_CONDITIONS: readonly WatchCondition[] = [
  'good',
  'fair',
  'poor',
  'worn',
  'parts_only',
] as const;

const STATUS_LABELS = {
  acquired: 'statusAcquired',
  in_progress: 'statusInProgress',
  listed: 'statusListed',
  sold: 'statusSold',
  paused: 'statusPaused',
  kept: 'statusKept',
  archived: 'statusArchived',
} as const satisfies Record<WatchStatus, string>;

const CONDITION_LABELS = {
  good: 'conditionGood',
  fair: 'conditionFair',
  poor: 'conditionPoor',
  worn: 'conditionWorn',
  parts_only: 'conditionPartsOnly',
} as const satisfies Record<WatchCondition, string>;

function makeFormSchema(t: TFunction) {
  return z.object({
    make: z.string().trim().min(1, t('validationMakeRequired')),
    model: z.string().trim().min(1, t('validationModelRequired')),
    reference: z.string().trim().optional(),
    year: numberField({ min: 1, message: t('validationYearRequired') }).pipe(
      z.number().int(),
    ),
    status: z.enum(WATCH_STATUSES),
    condition_bought: z.enum(WATCH_CONDITIONS),
    bought_price: numberField({
      min: 0,
      message: t('validationBoughtPriceMin'),
    }),
    parts_cost: numberField({ min: 0, message: t('validationPartsCostMin') }),
    bought_date: z.string().trim().min(1, t('validationBoughtDateRequired')),
    sold_price: z.preprocess((v) => {
      if (v === '' || v === null || typeof v === 'undefined') return null;
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isNaN(n) ? NaN : n;
    }, z.number().min(0).nullable()),
    sold_date: z.string().trim().nullable(),
    notes: z.string(),
  });
}

type FormValues = z.input<ReturnType<typeof makeFormSchema>>;

function EditWatchRoute() {
  const { watchId } = Route.useParams();
  const { t } = useTranslation();
  const formSchema = useMemo(() => makeFormSchema(t), [t]);
  const navigate = useNavigate();
  const posthog = usePostHog();
  const { data: watch, isLoading: isWatchLoading } = useGetWatchById(watchId);
  const { data: user, isLoading: isUserLoading } = useUser();
  const updateWatch = useUpdateWatch();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const editorRef = useRef<TiptapEditorRef>(null);
  const featuredInputRef = useRef<HTMLInputElement>(null);

  const defaultValues = useMemo<FormValues>(() => {
    if (!watch) {
      return {
        make: '',
        model: '',
        reference: '',
        year: new Date().getFullYear(),
        status: 'in_progress',
        condition_bought: 'good',
        bought_price: 0,
        parts_cost: 0,
        bought_date: '',
        sold_price: null,
        sold_date: null,
        notes: '',
      };
    }
    return {
      make: watch.make,
      model: watch.model,
      reference: watch.reference ?? '',
      year: watch.year,
      status: watch.status,
      condition_bought: watch.condition_bought,
      bought_price: watch.bought_price,
      parts_cost: watch.parts_cost,
      bought_date: watch.bought_date?.slice(0, 10) ?? '',
      sold_price: watch.sold_price,
      sold_date: watch.sold_date?.slice(0, 10) ?? null,
      notes: watch.notes ?? '',
    };
  }, [watch]);

  const featuredPreviewUrl = useMemo(
    () =>
      featuredImageFile
        ? URL.createObjectURL(featuredImageFile)
        : (watch?.featured_image_url ?? null),
    [featuredImageFile, watch?.featured_image_url],
  );

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  if (isWatchLoading || isUserLoading) {
    return (
      <div className='text-sm text-muted-foreground font-mono'>
        {t('equipmentLoading')}
      </div>
    );
  }

  if (!watch) {
    return (
      <div className='space-y-3'>
        <Link
          to='/watches'
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          {t('watchesBackToWatches')}
        </Link>
        <div className='text-sm text-red-400 font-mono'>
          {t('equipmentItemNotFound')}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='text-sm text-red-400 font-mono'>
        {t('equipmentUnauthorized')}
      </div>
    );
  }

  const onSubmit = handleSubmit(async (raw) => {
    setSubmitError(null);

    const parsed = formSchema.safeParse(raw);
    if (!parsed.success) return;

    const payload = {
      ...watch,
      ...parsed.data,
      reference: parsed.data.reference?.trim() ?? '',
      sold_date: parsed.data.sold_date?.trim() ? parsed.data.sold_date : null,
      notes: parsed.data.notes ?? '',
    };

    try {
      await updateWatch.mutateAsync(payload);
      if (featuredImageFile) {
        await WatchesApi.uploadFeaturedImage(watchId, featuredImageFile);
      }
      posthog.capture('watch_updated', {
        make: payload.make,
        model: payload.model,
        status: payload.status,
        previous_status: watch.status,
        sold_price: payload.sold_price,
      });
      navigate({
        to: '/watches/$watchId',
        params: { watchId },
      });
    } catch (e) {
      posthog.captureException(e);
      const msg = e instanceof Error ? e.message : 'Failed to save watch.';
      setSubmitError(msg);
    }
  });

  return (
    <div className='max-w-3xl'>
      <div className='mb-6'>
        <Link
          to='/watches/$watchId'
          params={{ watchId }}
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          {t('watchesBackToWatches')}
        </Link>
        <h1 className='mt-3 text-2xl font-serif font-semibold text-foreground'>
          {t('watchDetailsEdit')}
        </h1>
        <p className='mt-1 text-xs font-mono text-muted-foreground tracking-wide'>
          {watch.make} {watch.model}
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
                <FieldLabel htmlFor='make'>{t('fieldMake')}</FieldLabel>
                <Input
                  {...field}
                  id='make'
                  autoFocus
                  aria-invalid={fieldState.invalid}
                  placeholder={t('placeholderMake')}
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
                <FieldLabel htmlFor='model'>{t('fieldModel')}</FieldLabel>
                <Input
                  {...field}
                  id='model'
                  aria-invalid={fieldState.invalid}
                  placeholder={t('placeholderModel')}
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
                <FieldLabel htmlFor='reference'>
                  {t('fieldReference')}
                </FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  id='reference'
                  aria-invalid={fieldState.invalid}
                  placeholder={t('placeholderReference')}
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
                <FieldLabel htmlFor='year'>{t('fieldYear')}</FieldLabel>
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
                  <FieldLabel htmlFor='status'>{t('colStatus')}</FieldLabel>
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
                    <SelectValue placeholder={t('placeholderSelect')} />
                  </SelectTrigger>
                  <SelectContent position='item-aligned'>
                    {WATCH_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(STATUS_LABELS[s])}
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
                    {t('fieldConditionBought')}
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
                    <SelectValue placeholder={t('placeholderSelect')} />
                  </SelectTrigger>
                  <SelectContent position='item-aligned'>
                    {WATCH_CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(CONDITION_LABELS[c])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </section>

        <section className='grid grid-cols-2 gap-4'>
          <Controller
            name='bought_price'
            control={control}
            render={({ field: { onChange, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='bought_price'>
                  {t('fieldBoughtPrice')}
                </FieldLabel>
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
                <FieldLabel htmlFor='parts_cost'>{t('partsCost')}</FieldLabel>
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
        </section>

        <section className='grid grid-cols-2 gap-4'>
          <Controller
            name='bought_date'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='bought_date'>
                  {t('fieldBoughtDate')}
                </FieldLabel>
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
                  {t('fieldSoldDateOptional')}
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
                  {t('fieldSoldPriceOptional')}
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
        </section>

        <section>
          <Field>
            <FieldLabel htmlFor='featured_image'>
              {t('fieldFeaturedImage')}
            </FieldLabel>
            <div className='flex items-center gap-4'>
              <input
                ref={featuredInputRef}
                type='file'
                accept='image/*'
                id='featured_image'
                className='sr-only'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setFeaturedImageFile(file);
                  e.target.value = '';
                }}
              />
              <button
                type='button'
                onClick={() => featuredInputRef.current?.click()}
                className='relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-zinc-900 cursor-pointer flex items-center justify-center shrink-0 hover:border-zinc-600 transition-colors'
              >
                {featuredPreviewUrl ? (
                  <img
                    src={featuredPreviewUrl}
                    alt={t('placeholderFeaturedImageAlt')}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <ImagePlusIcon className='w-5 h-5 text-muted-foreground' />
                )}
              </button>
              <div className='flex flex-col gap-1'>
                <button
                  type='button'
                  onClick={() => featuredInputRef.current?.click()}
                  className='text-xs font-mono text-amber-400 hover:text-amber-300 text-left'
                >
                  {featuredPreviewUrl
                    ? t('featuredImageChange')
                    : t('featuredImageUpload')}
                </button>
                {featuredImageFile ? (
                  <>
                    <span className='text-xs font-mono text-muted-foreground truncate max-w-48'>
                      {featuredImageFile.name}
                    </span>
                    <button
                      type='button'
                      onClick={() => setFeaturedImageFile(null)}
                      className='text-xs font-mono text-muted-foreground hover:text-red-400 text-left'
                    >
                      {t('featuredImageRemove')}
                    </button>
                  </>
                ) : (
                  <span className='text-xs font-mono text-muted-foreground'>
                    {t('featuredImageHint')}
                  </span>
                )}
              </div>
            </div>
          </Field>
        </section>

        <section>
          <Controller
            name='notes'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='notes'>{t('fieldNotes')}</FieldLabel>
                <TiptapEditor
                  ref={editorRef}
                  value={field.value}
                  onChange={field.onChange}
                  minHeight='200px'
                  toolbarConfig={{
                    headings: [true, true, true],
                    bold: true,
                    bulletList: true,
                    orderedList: true,
                    blockquote: true,
                    undo: true,
                    redo: true,
                  }}
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
            disabled={isSubmitting || updateWatch.isPending}
          >
            {updateWatch.isPending
              ? t('equipmentSaving')
              : t('equipmentSaveChanges')}
          </Button>
          <Button asChild variant='outline'>
            <Link to='/watches/$watchId' params={{ watchId }}>
              {t('cancel')}
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
