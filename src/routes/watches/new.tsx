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
import { FREE_PROJECT_LIMIT } from '#/lib/constants';
import { useCreateWatch, useWatches } from '#/hooks/watches';
import { useUser } from '#/hooks/user';
import { useSubscription } from '#/hooks/subscription';
import { UpgradeButton } from '#/components/primitives/UpgradeButton';
import { WatchesApi } from '#/lib/api/watches';
import { AlertCircleIcon, ImagePlusIcon, LockIcon } from 'lucide-react';
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
import { FormSkeleton } from '#/components/skeletons';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';

export const Route = createFileRoute('/watches/new')({
  component: NewWatchRoute,
});

const WATCH_STATUSES: readonly WatchStatus[] = [
  'acquired',
  'in_progress',
  'listed',
  'sold',
  'paused',
  'kept',
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
    hours_spent: numberField({ min: 0, message: t('validationHoursMin') }),
    bought_date: z.string().trim().min(1, t('validationBoughtDateRequired')),
    sold_price: z.number().min(0).nullable(),
    sold_date: z.string().trim().nullable(),
    notes: z.string(),
  });
}

type FormData = z.infer<ReturnType<typeof makeFormSchema>>;

function NewWatchRoute() {
  const { t } = useTranslation();
  const formSchema = useMemo(() => makeFormSchema(t), [t]);
  const navigate = useNavigate();
  const posthog = usePostHog();
  const createWatch = useCreateWatch();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const editorRef = useRef<TiptapEditorRef>(null);
  const featuredInputRef = useRef<HTMLInputElement>(null);

  const { data: user, isPending: isUserPending } = useUser();
  const { isPro } = useSubscription();
  const { data: watches, isPending: isWatchesPending } = useWatches();

  const defaultValues = useMemo<FormData>(
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
      bought_date: new Date().toISOString().split('T')[0],
      sold_price: null,
      sold_date: null,
      notes: '',
    }),
    [],
  );

  const featuredPreviewUrl = useMemo(
    () => (featuredImageFile ? URL.createObjectURL(featuredImageFile) : null),
    [featuredImageFile],
  );

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  if (isUserPending || isWatchesPending) {
    return <FormSkeleton />;
  }

  const activeCount = (watches ?? []).filter((w) => w.status !== 'sold').length;
  const atProjectLimit = !isPro && activeCount >= FREE_PROJECT_LIMIT;

  if (atProjectLimit) {
    return (
      <div className='max-w-3xl'>
        <div className='mb-6'>
          <Link
            to='/watches'
            className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
          >
            {t('watchesBackToWatches')}
          </Link>
        </div>
        <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card px-8 py-16 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10'>
            <LockIcon className='h-5 w-5 text-amber-400' />
          </div>
          <div className='space-y-1'>
            <h2 className='font-serif font-semibold text-foreground'>
              {t('watchesProjectLimitTitle')}
            </h2>
            <p className='font-mono text-xs text-muted-foreground max-w-xs'>
              {t('watchesProjectLimitDesc', {
                limit: FREE_PROJECT_LIMIT,
                count: activeCount,
              })}
            </p>
          </div>
          {user && <UpgradeButton pbUserId={user.id} />}
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);

    if (!user) return;

    try {
      const created = await createWatch.mutateAsync({
        watch: {
          ...data,
          user: user.id,
          reference: data.reference ?? '',
          featured_image: null,
        },
      });
      if (featuredImageFile) {
        await WatchesApi.uploadFeaturedImage(created.id, featuredImageFile);
      }
      posthog.capture('watch_created', {
        make: data.make,
        model: data.model,
        status: data.status,
        condition_bought: data.condition_bought,
        bought_price: data.bought_price,
        has_featured_image: !!featuredImageFile,
      });
      navigate({
        to: '/watches/$watchId',
        params: { watchId: created.id },
      });
    } catch (e) {
      posthog.captureException(e);
      const msg = e instanceof Error ? e.message : 'Failed to create watch.';
      setSubmitError(msg);
    }
  };

  return (
    <div className='max-w-3xl'>
      <div className='mb-6'>
        <Link
          to='/watches'
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          {t('watchesBackToWatches')}
        </Link>
        <h1 className='mt-3 text-2xl font-serif font-semibold text-foreground'>
          {t('addWatch')}
        </h1>
        <p className='mt-1 text-xs font-mono text-muted-foreground tracking-wide'>
          {t('watchesNewSub')}
        </p>
      </div>

      {submitError && (
        <div className='grid w-full max-w-md items-start gap-4 mb-6'>
          <Alert className='bg-destructive/10'>
            <AlertCircleIcon />
            <AlertTitle>{t('uhOh')}</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        </div>
      )}

      <form
        id='watch-form'
        onSubmit={handleSubmit(onSubmit)}
        className='space-y-6'
      >
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

        <section className='grid grid-cols-3 gap-4'>
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

          <Controller
            name='hours_spent'
            control={control}
            render={({ field: { onChange, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='hours_spent'>
                  {t('fieldHoursSpent')}
                </FieldLabel>
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
                    italic: true,
                    strike: true,
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
            disabled={isSubmitting || createWatch.isPending}
          >
            {createWatch.isPending
              ? t('watchesCreating')
              : t('watchesCreateWatch')}
          </Button>
          <Button asChild variant='outline'>
            <Link to='/watches'>{t('cancel')}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
