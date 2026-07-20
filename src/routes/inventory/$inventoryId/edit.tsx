'use client';

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  CrystalMaterial,
  CrystalShape,
  MainspringType,
  type CrystalSpecs,
  type Inventory,
  type InventoryCategory,
  type MainspringSpecs,
} from '#/types';
import { Btn } from '#/components/primitives/Button';
import { numberField } from '#/lib/helpers';
import { useUser } from '#/hooks/user';
import {
  useCreateCrystalSpecs,
  useCreateMainspringSpecs,
  useGetInventoryById,
  useUpdateCrystalSpecs,
  useUpdateInventory,
  useUpdateMainspringSpecs,
} from '#/hooks/inventory';
import {
  usePartVocabulary,
  useCreateMovementPart,
} from '#/hooks/movementParts';
import { PartTagInput } from '#/components/inventory/PartTagInput';
import type { RecordModel } from 'pocketbase';
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

export const Route = createFileRoute('/inventory/$inventoryId/edit')({
  component: EditInventoryRoute,
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
  'harvested_part',
  'movement',
  'mainspring',
  'crystal',
  'strap',
  'bracelet',
  'crown',
  'gasket',
  'hand',
  'dial',
  'bezel',
  'case',
  'tool',
  'oil',
  'other',
] as const;

const MAINSPRING_TYPE_KEY_MAP = {
  automatic_bridle: 'mainspringTypeAutomaticBridle',
  manual_reverse_eye: 'mainspringTypeManualReverseEye',
} as const satisfies Record<MainspringType, string>;

const MAINSPRING_TYPES: readonly MainspringType[] = [
  MainspringType.AUTOMATIC_BRIDLE,
  MainspringType.MANUAL_REVERSE_EYE,
] as const;

const CRYSTAL_MATERIAL_KEY_MAP = {
  acrylic: 'crystalMaterialAcrylic',
  mineral: 'crystalMaterialMineral',
  sapphire: 'crystalMaterialSapphire',
} as const satisfies Record<CrystalMaterial, string>;

const CRYSTAL_MATERIALS: readonly CrystalMaterial[] = [
  CrystalMaterial.ACRYLIC,
  CrystalMaterial.MINERAL,
  CrystalMaterial.SAPPHIRE,
] as const;

const CRYSTAL_SHAPE_KEY_MAP = {
  flat: 'crystalShapeFlat',
  low_dome: 'crystalShapeLowDome',
  high_dome: 'crystalShapeHighDome',
  stepped: 'crystalShapeStepped',
} as const satisfies Record<CrystalShape, string>;

const CRYSTAL_SHAPES: readonly CrystalShape[] = [
  CrystalShape.FLAT,
  CrystalShape.LOW_DOME,
  CrystalShape.HIGH_DOME,
  CrystalShape.STEPPED,
] as const;

function makeFormSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('validationRequired'))
      .max(256, t('validationMaxLength', { max: 256 })),
    category: z.enum(INVENTORY_CATEGORIES),
    qty: numberField({ min: 0, message: t('validationQtyMin') }),
    unit_cost: numberField({ min: 0, message: t('validationUnitCostMin') }),
    supplier: z.string(),
    notes: z.string(),
    is_donor: z.boolean(),
    missing_parts: z.array(z.string()),
    diameter_mm: z.number().min(0).optional(),
    height_mm: z.number().min(0).optional(),
    thickness_mm: z.number().min(0).optional(),
    length_mm: z.number().min(0).optional(),
    mainspring_type: z.enum(MAINSPRING_TYPES).optional(),
    crystal_material: z.enum(CRYSTAL_MATERIALS).optional(),
    crystal_shape: z.enum(CRYSTAL_SHAPES).optional(),
  });
}

type FormData = z.infer<ReturnType<typeof makeFormSchema>>;

function EditInventoryRoute() {
  const { t } = useTranslation();
  const { inventoryId } = Route.useParams();
  const { data: item, isLoading: isItemLoading } =
    useGetInventoryById(inventoryId);
  const { data: user, isLoading: isUserLoading } = useUser();

  if (isItemLoading || isUserLoading) {
    return (
      <div className='text-sm text-muted-foreground font-mono'>{t('inventoryLoading')}</div>
    );
  }

  if (!item) {
    return (
      <div className='space-y-3'>
        <Link
          to='/inventory'
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          {t('inventoryBackToInventory')}
        </Link>
        <div className='text-sm text-red-400 font-mono'>{t('inventoryItemNotFound')}</div>
      </div>
    );
  }

  if (!user) {
    return <div className='text-sm text-red-400 font-mono'>{t('inventoryUnauthorized')}</div>;
  }

  return <EditInventoryForm item={item} />;
}

function EditInventoryForm({ item }: { item: RecordModel }) {
  const { t } = useTranslation();
  const formSchema = useMemo(() => makeFormSchema(t), [t]);
  const navigate = useNavigate();
  const updateInventory = useUpdateInventory();
  const createMainspringSpecs = useCreateMainspringSpecs();
  const updateMainspringSpecs = useUpdateMainspringSpecs();
  const createCrystalSpecs = useCreateCrystalSpecs();
  const updateCrystalSpecs = useUpdateCrystalSpecs();
  const createMovementPart = useCreateMovementPart();
  const vocabulary = usePartVocabulary();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mainspringSpecs = item.expand?.mainspring_specs_via_inventory as
    | MainspringSpecs
    | undefined;
  const crystalSpecs = item.expand?.crystal_specs_via_inventory as
    | CrystalSpecs
    | undefined;

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item.name as string,
      category: (item.category as InventoryCategory) ?? 'movement',
      qty: item.qty as number,
      unit_cost: item.unit_cost as number,
      supplier: (item.supplier as string) ?? '',
      notes: (item.notes as string) ?? '',
      is_donor: (item.is_donor as boolean) ?? false,
      missing_parts: (item.missing_parts as string[]) ?? [],
      diameter_mm: mainspringSpecs?.diameter_mm ?? crystalSpecs?.diameter_mm,
      height_mm: mainspringSpecs?.height_mm,
      thickness_mm: mainspringSpecs?.thickness_mm,
      length_mm: mainspringSpecs?.length_mm,
      mainspring_type: mainspringSpecs?.type,
      crystal_material: crystalSpecs?.material,
      crystal_shape: crystalSpecs?.shape,
    },
  });

  const category = useWatch({ control, name: 'category' });
  const isDonor = useWatch({ control, name: 'is_donor' });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    const payload = {
      id: item.id,
      user: item['user'] as string,
      name: data.name,
      qty: data.qty,
      unit_cost: data.unit_cost,
      category: data.category,
      supplier: data.supplier,
      notes: data.notes,
      is_donor: data.is_donor,
      missing_parts: data.missing_parts,
    } as Inventory;
    try {
      await updateInventory.mutateAsync(payload);
      if (data.category === 'mainspring') {
        const specs = {
          inventory: item.id,
          diameter_mm: data.diameter_mm,
          height_mm: data.height_mm,
          thickness_mm: data.thickness_mm,
          length_mm: data.length_mm,
          type: data.mainspring_type,
        };
        if (mainspringSpecs) {
          await updateMainspringSpecs.mutateAsync({
            ...specs,
            id: mainspringSpecs.id,
          });
        } else {
          await createMainspringSpecs.mutateAsync(specs);
        }
      } else if (data.category === 'crystal') {
        const specs = {
          inventory: item.id,
          diameter_mm: data.diameter_mm,
          material: data.crystal_material,
          shape: data.crystal_shape,
        };
        if (crystalSpecs) {
          await updateCrystalSpecs.mutateAsync({ ...specs, id: crystalSpecs.id });
        } else {
          await createCrystalSpecs.mutateAsync(specs);
        }
      }
      navigate({ to: '/inventory' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save item.';
      setSubmitError(msg);
    }
  });

  return (
    <div className='max-w-3xl'>
      <div className='mb-6'>
        <Link
          to='/inventory'
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          {t('inventoryBackToInventory')}
        </Link>
        <h1 className='mt-3 text-2xl font-serif font-semibold text-foreground'>
          {t('inventoryEditItem')}
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
              <Field orientation='responsive' data-invalid={fieldState.invalid}>
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
        )}

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

        {category === 'mainspring' && (
          <section className='grid grid-cols-2 gap-4'>
            <Controller
              name='diameter_mm'
              control={control}
              render={({ field: { onChange, value, ...field }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='diameter_mm'>
                    {t('fieldDiameterMm')}
                  </FieldLabel>
                  <Input
                    {...field}
                    value={value ?? ''}
                    id='diameter_mm'
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

            <Controller
              name='height_mm'
              control={control}
              render={({ field: { onChange, value, ...field }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='height_mm'>
                    {t('fieldHeightMm')}
                  </FieldLabel>
                  <Input
                    {...field}
                    value={value ?? ''}
                    id='height_mm'
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

            <Controller
              name='thickness_mm'
              control={control}
              render={({ field: { onChange, value, ...field }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='thickness_mm'>
                    {t('fieldThicknessMm')}
                  </FieldLabel>
                  <Input
                    {...field}
                    value={value ?? ''}
                    id='thickness_mm'
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

            <Controller
              name='length_mm'
              control={control}
              render={({ field: { onChange, value, ...field }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='length_mm'>
                    {t('fieldLengthMm')}
                  </FieldLabel>
                  <Input
                    {...field}
                    value={value ?? ''}
                    id='length_mm'
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

            <Controller
              name='mainspring_type'
              control={control}
              render={({ fieldState, field }) => (
                <Field orientation='responsive' data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor='mainspring_type'>
                      {t('fieldMainspringType')}
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
                      id='mainspring_type'
                      aria-invalid={fieldState.invalid}
                      className='min-w-30'
                    >
                      <SelectValue placeholder={t('placeholderSelect')} />
                    </SelectTrigger>
                    <SelectContent position='item-aligned'>
                      {MAINSPRING_TYPES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {t(MAINSPRING_TYPE_KEY_MAP[v])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </section>
        )}

        {category === 'crystal' && (
          <section className='grid grid-cols-2 gap-4'>
            <Controller
              name='diameter_mm'
              control={control}
              render={({ field: { onChange, value, ...field }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='diameter_mm'>
                    {t('fieldDiameterMm')}
                  </FieldLabel>
                  <Input
                    {...field}
                    value={value ?? ''}
                    id='diameter_mm'
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

            <Controller
              name='crystal_material'
              control={control}
              render={({ fieldState, field }) => (
                <Field orientation='responsive' data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor='crystal_material'>
                      {t('fieldCrystalMaterial')}
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
                      id='crystal_material'
                      aria-invalid={fieldState.invalid}
                      className='min-w-30'
                    >
                      <SelectValue placeholder={t('placeholderSelect')} />
                    </SelectTrigger>
                    <SelectContent position='item-aligned'>
                      {CRYSTAL_MATERIALS.map((v) => (
                        <SelectItem key={v} value={v}>
                          {t(CRYSTAL_MATERIAL_KEY_MAP[v])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <Controller
              name='crystal_shape'
              control={control}
              render={({ fieldState, field }) => (
                <Field orientation='responsive' data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor='crystal_shape'>
                      {t('fieldCrystalShape')}
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
                      id='crystal_shape'
                      aria-invalid={fieldState.invalid}
                      className='min-w-30'
                    >
                      <SelectValue placeholder={t('placeholderSelect')} />
                    </SelectTrigger>
                    <SelectContent position='item-aligned'>
                      {CRYSTAL_SHAPES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {t(CRYSTAL_SHAPE_KEY_MAP[v])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </section>
        )}

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
            disabled={isSubmitting || updateInventory.isPending}
          >
            {updateInventory.isPending ? t('inventorySaving') : t('inventorySaveChanges')}
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
  );
}
