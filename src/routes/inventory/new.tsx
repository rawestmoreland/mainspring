'use client';

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateInventoryItem, InventoryCategory } from '#/types';
import { Btn } from '#/components/primitives/Button';
import { numberField } from '#/lib/helpers';
import { useUser } from '#/hooks/user';
import { useCreateInventory } from '#/hooks/inventory';
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

export const Route = createFileRoute('/inventory/new')({
  component: NewInventoryRoute,
});

const INVENTORY_CATEGORIES: readonly InventoryCategory[] = [
  'movement',
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

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'This is required')
    .max(256, 'Must be fewer than 256 characters'),
  category: z.enum(INVENTORY_CATEGORIES),
  qty: numberField({ min: 0, message: 'Quantity must be 0 or more' }),
  unit_cost: numberField({
    min: 0,
    message: 'Unit cost must be 0 or more',
  }),
  supplier: z.string(),
  notes: z.string(),
});

type FormData = z.infer<typeof formSchema>;

function NewInventoryRoute() {
  const navigate = useNavigate();
  const createInventory = useCreateInventory();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: user, isLoading: isUserLoading } = useUser();

  const defaultValues = useMemo<FormData>(
    () => ({
      name: '',
      category: 'movement',
      qty: 1,
      unit_cost: 0,
      supplier: '',
      notes: '',
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

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Unauthorized</div>;
  }

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);

    const payload: CreateInventoryItem = data;

    try {
      await createInventory.mutateAsync(payload);
      navigate({ to: '/inventory' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create item.';
      setSubmitError(msg);
    }
  };

  return (
    <div className='max-w-3xl'>
      <div className='mb-6'>
        <Link
          to='/inventory'
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          ← Back to Inventory
        </Link>
        <h1 className='mt-3 text-2xl font-serif font-semibold text-foreground'>
          Add Item
        </h1>
        <p className='mt-1 text-xs font-mono text-muted-foreground tracking-wide'>
          Add a part to your inventory
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

      <form id='inventory-item-form' onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        <section className='grid grid-cols-2 gap-4'>
          <Controller
            name='name'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='name'>Name</FieldLabel>
                <Input
                  {...field}
                  id='name'
                  aria-invalid={fieldState.invalid}
                  placeholder='Mainspring'
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
                  <FieldLabel htmlFor='category'>Category</FieldLabel>
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
                    <SelectValue placeholder='select' />
                  </SelectTrigger>
                  <SelectContent position='item-aligned'>
                    {INVENTORY_CATEGORIES.map((c) => (
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

        <section className='grid grid-cols-2 gap-4'>
          <Controller
            name='qty'
            control={control}
            render={({ field: { onChange, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='qty'>Quantity</FieldLabel>
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
                <FieldLabel htmlFor='unit_cost'>Unit Cost</FieldLabel>
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

        <section className='grid grid-cols-2 gap-4'>
          <Controller
            name='supplier'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='supplier'>Supplier</FieldLabel>
                <Input
                  {...field}
                  id='supplier'
                  aria-invalid={fieldState.invalid}
                  placeholder='e.g. Cousins UK'
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
          <Btn
            type='submit'
            disabled={isSubmitting || createInventory.isPending}
          >
            {createInventory.isPending ? 'Creating…' : 'Create item'}
          </Btn>
          <Link to='/inventory' className='inline-block'>
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
