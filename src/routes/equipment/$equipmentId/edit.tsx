'use client';

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { Equipment } from '#/types';
import { Btn } from '#/components/primitives/Button';
import { numberField } from '#/lib/helpers';
import { useUser } from '#/hooks/user';
import { useGetEquipmentById, useUpdateEquipment } from '#/hooks/equipment';
import type { RecordModel } from 'pocketbase';
import {
  Field,
  FieldError,
  FieldLabel,
} from '#/components/ui/field';
import { Input } from '#/components/ui/input';

export const Route = createFileRoute('/equipment/$equipmentId/edit')({
  component: EditEquipmentRoute,
});

function makeFormSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('validationRequired'))
      .max(256, t('validationMaxLength', { max: 256 })),
    cost: numberField({ min: 0, message: t('validationCostMin') }),
    date_acquired: z.string().min(1, t('validationDateRequired')),
    supplier: z.string(),
    notes: z.string(),
  });
}

type FormData = z.infer<ReturnType<typeof makeFormSchema>>;

function EditEquipmentRoute() {
  const { t } = useTranslation();
  const { equipmentId } = Route.useParams();
  const { data: item, isLoading: isItemLoading } = useGetEquipmentById(equipmentId);
  const { data: user, isLoading: isUserLoading } = useUser();

  if (isItemLoading || isUserLoading) {
    return <div className='text-sm text-muted-foreground font-mono'>{t('equipmentLoading')}</div>;
  }

  if (!item) {
    return (
      <div className='space-y-3'>
        <Link
          to='/equipment'
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          {t('equipmentBackToEquipment')}
        </Link>
        <div className='text-sm text-red-400 font-mono'>{t('equipmentItemNotFound')}</div>
      </div>
    );
  }

  if (!user) {
    return <div className='text-sm text-red-400 font-mono'>{t('equipmentUnauthorized')}</div>;
  }

  return <EditEquipmentForm item={item} />;
}

function EditEquipmentForm({ item }: { item: RecordModel }) {
  const { t } = useTranslation();
  const formSchema = useMemo(() => makeFormSchema(t), [t]);
  const navigate = useNavigate();
  const updateEquipment = useUpdateEquipment();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item.name as string,
      cost: item.cost as number,
      date_acquired: ((item.date_acquired as string) ?? '').slice(0, 10),
      supplier: (item.supplier as string) ?? '',
      notes: (item.notes as string) ?? '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    const payload = {
      id: item.id,
      user: item['user'] as string,
      name: data.name,
      cost: data.cost,
      date_acquired: data.date_acquired,
      supplier: data.supplier,
      notes: data.notes,
    } as Equipment;
    try {
      await updateEquipment.mutateAsync(payload);
      navigate({ to: '/equipment' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save item.';
      setSubmitError(msg);
    }
  });

  return (
    <div className='max-w-3xl'>
      <div className='mb-6'>
        <Link
          to='/equipment'
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          {t('equipmentBackToEquipment')}
        </Link>
        <h1 className='mt-3 text-2xl font-serif font-semibold text-foreground'>
          {t('equipmentEditTool')}
        </h1>
        <p className='mt-1 text-xs font-mono text-muted-foreground tracking-wide'>
          {item.name as string}
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
            name='name'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='name'>{t('colName')}</FieldLabel>
                <Input
                  {...field}
                  id='name'
                  autoFocus
                  aria-invalid={fieldState.invalid}
                  placeholder={t('placeholderToolName')}
                  autoComplete='off'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='cost'
            control={control}
            render={({ field: { onChange, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='cost'>{t('colCost')}</FieldLabel>
                <Input
                  {...field}
                  id='cost'
                  type='number'
                  inputMode='decimal'
                  step='0.01'
                  min={0}
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
            name='date_acquired'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='date_acquired'>{t('equipmentDateAcquired')}</FieldLabel>
                <Input
                  {...field}
                  id='date_acquired'
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
            name='supplier'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='supplier'>{t('fieldSupplier')}</FieldLabel>
                <Input
                  {...field}
                  id='supplier'
                  aria-invalid={fieldState.invalid}
                  placeholder={t('placeholderEquipmentSupplier')}
                  autoComplete='off'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </section>

        <section>
          <Controller
            name='notes'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='notes'>{t('fieldNotes')}</FieldLabel>
                <textarea
                  {...field}
                  id='notes'
                  rows={4}
                  aria-invalid={fieldState.invalid}
                  placeholder={t('placeholderNotes')}
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
          <Btn
            type='submit'
            disabled={isSubmitting || updateEquipment.isPending}
          >
            {updateEquipment.isPending ? t('equipmentSaving') : t('equipmentSaveChanges')}
          </Btn>
          <Link to='/equipment' className='inline-block'>
            <button
              type='button'
              className='rounded font-semibold tracking-wide transition-opacity hover:opacity-90 cursor-pointer bg-transparent text-muted-foreground border border-border hover:text-foreground hover:border-ring px-4 py-2 text-xs'
            >
              {t('cancel')}
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
