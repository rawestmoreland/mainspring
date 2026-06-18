'use client';

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePostHog } from '@posthog/react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { InventoryCategory, InventoryItem } from '#/types';
import { Btn } from '#/components/primitives/Button';
import { numberField } from '#/lib/helpers';
import { useUser } from '#/hooks/user';
import {
  useCreateInventory,
  useInventory,
  useUpdateInventory,
} from '#/hooks/inventory';
import { useCreateDonorMovement } from '#/hooks/donorMovements';
import {
  usePartVocabulary,
  useCreateMovementPart,
} from '#/hooks/movementParts';
import { PartTagInput } from '#/components/inventory/PartTagInput';
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
import { FormSkeleton } from '#/components/skeletons';
import { HarvestInventoryDialog } from '#/components/inventory/HarvestInventoryDialog';

export const Route = createFileRoute('/inventory/new')({
  component: NewInventoryRoute,
});

const CATEGORY_KEY_MAP = {
  movement: 'categoryMovement',
  harvested_part: 'categoryHarvestedPart',
  mainspring: 'categoryMainspring',
  crystal: 'categoryCrystal',
  strap: 'categoryStrap',
  bracelet: 'categoryBracelet',
  crown: 'categoryCrown',
  gasket: 'categoryGasket',
  hand: 'categoryHand',
  dial: 'categoryDial',
  bezel: 'categoryBezel',
  case: 'categoryCase',
  tool: 'categoryTool',
  oil: 'categoryOil',
  other: 'categoryOther',
} as const satisfies Record<InventoryCategory, string>;

const INVENTORY_CATEGORIES: readonly InventoryCategory[] = [
  InventoryCategory.MOVEMENT,
  InventoryCategory.HARVESTED_PART,
  InventoryCategory.MAINSPRING,
  InventoryCategory.CRYSTAL,
  InventoryCategory.STRAP,
  InventoryCategory.BRACELET,
  InventoryCategory.CROWN,
  InventoryCategory.GASKET,
  InventoryCategory.HAND,
  InventoryCategory.DIAL,
  InventoryCategory.BEZEL,
  InventoryCategory.CASE,
  InventoryCategory.TOOL,
  InventoryCategory.OIL,
  InventoryCategory.OTHER,
] as const;

function makeFormSchema(t: TFunction) {
  return z
    .object({
      name: z.string().trim().max(256),
      caliber: z.string().trim().max(256),
      manufacturer: z.string().trim().max(256),
      jewels: z.number().int().min(0).optional(),
      category: z.enum(INVENTORY_CATEGORIES),
      qty: numberField({ min: 0, message: t('validationQtyMin') }),
      unit_cost: numberField({ min: 0, message: t('validationUnitCostMin') }),
      supplier: z.string(),
      notes: z.string(),
      is_donor: z.boolean(),
      missing_parts: z.array(z.string()),
    })
    .superRefine((data, ctx) => {
      if (data.is_donor) {
        if (!data.caliber) {
          ctx.addIssue({
            code: 'custom',
            path: ['caliber'],
            message: t('validationCaliberRequired'),
          });
        }
        if (!data.manufacturer) {
          ctx.addIssue({
            code: 'custom',
            path: ['manufacturer'],
            message: t('validationManufacturerRequired'),
          });
        }
      } else {
        if (!data.name) {
          ctx.addIssue({
            code: 'custom',
            path: ['name'],
            message: t('validationPartNameRequired'),
          });
        }
      }
    });
}

type FormData = z.infer<ReturnType<typeof makeFormSchema>>;

function NewInventoryRoute() {
  const { t } = useTranslation();
  const formSchema = useMemo(() => makeFormSchema(t), [t]);
  const navigate = useNavigate();
  const posthog = usePostHog();
  const createInventory = useCreateInventory();
  const createDonorMovement = useCreateDonorMovement();
  const createMovementPart = useCreateMovementPart();
  const vocabulary = usePartVocabulary();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingParts, setPendingParts] = useState<string[] | null>(null);
  const pendingDonorRef = useRef<{
    caliber: string;
    manufacturer: string;
    userId: string;
  } | null>(null);

  const { data: user, isPending: isUserPending } = useUser();

  const { data: inventory = [] } = useInventory();
  const updateInventory = useUpdateInventory();

  const defaultValues = useMemo<FormData>(
    () => ({
      name: '',
      caliber: '',
      manufacturer: '',
      jewels: undefined,
      category: InventoryCategory.MOVEMENT,
      qty: 1,
      unit_cost: 0,
      supplier: '',
      notes: '',
      is_donor: false,
      missing_parts: [],
    }),
    [],
  );

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const category = useWatch({ control, name: 'category' });
  const isDonor = useWatch({ control, name: 'is_donor' });

  if (isUserPending) return <FormSkeleton />;

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    if (!user) return;
    try {
      if (data.is_donor) {
        await createDonorMovement.mutateAsync({
          user: user.id,
          caliber: data.caliber,
          manufacturer: data.manufacturer,
          missing_parts: data.missing_parts,
          ...(data.jewels !== undefined ? { jewels: data.jewels } : {}),
        });
        posthog.capture('donor_movement_added', {
          caliber: data.caliber,
          manufacturer: data.manufacturer,
          missing_parts_count: data.missing_parts.length,
        });
        if (data.missing_parts.length > 0) {
          pendingDonorRef.current = {
            caliber: data.caliber,
            manufacturer: data.manufacturer,
            userId: user.id,
          };
          setPendingParts(data.missing_parts);
        } else {
          navigate({ to: '/inventory' });
        }
      } else {
        await createInventory.mutateAsync({
          inventory: { ...data, user: user.id },
        });
        posthog.capture('inventory_item_created', {
          category: data.category,
          qty: data.qty,
          unit_cost: data.unit_cost,
        });
        navigate({ to: '/inventory' });
      }
    } catch (e) {
      posthog.captureException(e);
      const msg = e instanceof Error ? e.message : 'Failed to create item.';
      setSubmitError(msg);
    }
  };

  async function handleInventoryConfirm(selectedParts: string[]) {
    const ctx = pendingDonorRef.current;
    if (ctx) {
      for (const partName of selectedParts) {
        const existing = inventory.find(
          (item) => item.name.toLowerCase() === partName.toLowerCase(),
        ) as InventoryItem | undefined;
        if (existing) {
          await updateInventory.mutateAsync({ ...existing, qty: existing.qty + 1 });
        } else {
          await createInventory.mutateAsync({
            inventory: {
              name: `${partName} (from ${ctx.caliber})`,
              category: InventoryCategory.HARVESTED_PART,
              qty: 1,
              unit_cost: 0,
              user: ctx.userId,
              notes: `Harvested from ${ctx.caliber} (${ctx.manufacturer})`,
            },
          });
        }
      }
    }
    setPendingParts(null);
    navigate({ to: '/inventory' });
  }

  function handleInventorySkip() {
    setPendingParts(null);
    navigate({ to: '/inventory' });
  }

  return (
    <>
      <HarvestInventoryDialog
        open={pendingParts !== null}
        parts={pendingParts ?? []}
        onConfirm={handleInventoryConfirm}
        onSkip={handleInventorySkip}
      />
      <div className='max-w-3xl'>
        <div className='mb-6'>
          <Link
            to='/inventory'
            className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
          >
            {t('inventoryBackToInventory')}
          </Link>
          <h1 className='mt-3 text-2xl font-serif font-semibold text-foreground'>
            {t('inventoryAddItem')}
          </h1>
          <p className='mt-1 text-xs font-mono text-muted-foreground tracking-wide'>
            {t('inventoryAddItemSub')}
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

        <form
          id='inventory-item-form'
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-6'
        >
          {!isDonor && (
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
                      aria-invalid={fieldState.invalid}
                      placeholder={t('placeholderPartName')}
                      autoComplete='off'
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name='category'
                control={control}
                render={({ fieldState, field }) => (
                  <Field
                    orientation='responsive'
                    data-invalid={fieldState.invalid}
                  >
                    <FieldContent>
                      <FieldLabel htmlFor='category'>{t('fieldCategory')}</FieldLabel>
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
                        id='category'
                        aria-invalid={fieldState.invalid}
                        className='min-w-30'
                      >
                        <SelectValue placeholder={t('placeholderSelect')} />
                      </SelectTrigger>
                      <SelectContent position='item-aligned'>
                        {INVENTORY_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {t(CATEGORY_KEY_MAP[c])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </section>
          )}

          {category === 'movement' && (
            <Controller
              name='is_donor'
              control={control}
              render={({ field }) => (
                <label className='flex items-center gap-2.5 cursor-pointer w-fit'>
                  <input
                    type='checkbox'
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className='size-4 rounded border-input bg-transparent accent-amber-500 cursor-pointer'
                  />
                  <span className='font-mono text-xs text-foreground'>
                    {t('inventoryDonorMovementLabel')}
                  </span>
                  <span className='font-mono text-[10px] text-muted-foreground'>
                    {t('inventoryDonorMovementHint')}
                  </span>
                </label>
              )}
            />
          )}

          {isDonor && (
            <>
              <section className='grid grid-cols-2 gap-4'>
                <Controller
                  name='caliber'
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='caliber'>{t('fieldCaliber')}</FieldLabel>
                      <Input
                        {...field}
                        id='caliber'
                        aria-invalid={fieldState.invalid}
                        placeholder={t('placeholderCaliber')}
                        autoComplete='off'
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name='manufacturer'
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='manufacturer'>
                        {t('fieldManufacturer')}
                      </FieldLabel>
                      <Input
                        {...field}
                        id='manufacturer'
                        aria-invalid={fieldState.invalid}
                        placeholder={t('placeholderManufacturer')}
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
                <p className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5'>
                  {t('inventoryMissingParts')}
                </p>
                <p className='font-mono text-[10px] text-muted-foreground mb-2'>
                  {t('inventoryMissingPartsSub')}
                </p>
                <Controller
                  name='missing_parts'
                  control={control}
                  render={({ field }) => (
                    <PartTagInput
                      value={field.value}
                      onChange={field.onChange}
                      vocabulary={vocabulary}
                      onCreatePart={async (name) => {
                        await createMovementPart.mutateAsync(name);
                      }}
                    />
                  )}
                />
              </section>
            </>
          )}

          {!isDonor && (
            <section className='grid grid-cols-2 gap-4'>
              <Controller
                name='qty'
                control={control}
                render={({ field: { onChange, ...field }, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='qty'>{t('fieldQuantity')}</FieldLabel>
                    <Input
                      {...field}
                      id='qty'
                      type='number'
                      step='1'
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

              <Controller
                name='unit_cost'
                control={control}
                render={({ field: { onChange, ...field }, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='unit_cost'>{t('fieldUnitCost')}</FieldLabel>
                    <Input
                      {...field}
                      id='unit_cost'
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
          )}

          {!isDonor && (
            <section className='grid grid-cols-2 gap-4'>
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
                      placeholder={t('placeholderSupplier')}
                      autoComplete='off'
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </section>
          )}

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
              disabled={
                isSubmitting ||
                createInventory.isPending ||
                createDonorMovement.isPending
              }
            >
              {createInventory.isPending || createDonorMovement.isPending
                ? t('inventoryCreating')
                : t('inventoryCreateItem')}
            </Btn>
            <Link to='/inventory' className='inline-block'>
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
    </>
  );
}
