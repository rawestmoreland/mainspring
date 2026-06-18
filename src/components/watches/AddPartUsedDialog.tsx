import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns/format';
import { useInventory } from '#/hooks/inventory';
import { useCreatePartUsed } from '#/hooks/parts_used';
import { Btn } from '#/components/primitives/Button';
import { Field, FieldError, FieldLabel } from '#/components/ui/field';
import { Input } from '#/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { Button } from '#/components/ui/button';

const schema = z.object({
  inventory_item: z.string().min(1, 'Select an inventory item'),
  qty_used: z.number({ error: 'Required' }).int().min(1, 'Must be at least 1'),
  date_used: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  watchId: string;
};

export function AddPartUsedDialog({ watchId }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: rawInventory = [] } = useInventory();
  const inventory = rawInventory.filter(
    (i) => !(i as { is_donor?: boolean }).is_donor,
  );
  const createPartUsed = useCreatePartUsed(watchId);

  const today = format(new Date(), 'yyyy-MM-dd');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      inventory_item: '',
      qty_used: 1,
      date_used: today,
      notes: '',
    },
  });
  const selectedInventoryId = watch('inventory_item');
  const selectedItem = inventory.find((i) => i.id === selectedInventoryId);

  const onSubmit = async (data: FormData) => {
    if (selectedItem && data.qty_used > selectedItem.qty) {
      setError('qty_used', { message: `Only ${selectedItem.qty} in stock` });
      return;
    }
    await createPartUsed.mutateAsync({
      inventory_item: data.inventory_item,
      qty_used: data.qty_used,
      date_used: data.date_used,
      notes: data.notes || undefined,
    });
    reset({ inventory_item: '', qty_used: 1, date_used: today, notes: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Btn sm ghost>
          {t('addPartBtn')}
        </Btn>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('addPartDialogTitle')}</DialogTitle>
        </DialogHeader>
        <form
          id='add-part-form'
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-4 pt-1'
        >
          <Controller
            name='inventory_item'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='inventory_item'>Part</FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id='inventory_item'
                    aria-invalid={fieldState.invalid}
                    className='w-full'
                  >
                    <SelectValue placeholder='Select a part…' />
                  </SelectTrigger>
                  <SelectContent position='popper'>
                    {inventory.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                        disabled={item.qty <= 0}
                      >
                        {item.name}
                        <span className='ml-1.5 text-muted-foreground text-[11px]'>
                          ({item.qty} in stock)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className='grid grid-cols-2 gap-3'>
            <Controller
              name='qty_used'
              control={control}
              render={({ field: { onChange, ...field }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='qty_used'>Qty Used</FieldLabel>
                  <Input
                    {...field}
                    id='qty_used'
                    type='number'
                    step='1'
                    min={1}
                    max={selectedItem?.qty}
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
              name='date_used'
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='date_used'>Date</FieldLabel>
                  <Input
                    {...field}
                    id='date_used'
                    type='date'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <Controller
            name='notes'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='notes'>
                  Notes{' '}
                  <span className='text-muted-foreground font-normal'>
                    (optional)
                  </span>
                </FieldLabel>
                <textarea
                  {...field}
                  id='notes'
                  rows={2}
                  placeholder='e.g. replaced worn original'
                  className='w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'
                />
              </Field>
            )}
          />
        </form>
        <DialogFooter showCloseButton>
          <Button
            type='submit'
            form='add-part-form'
            disabled={isSubmitting || createPartUsed.isPending}
          >
            {createPartUsed.isPending ? t('addPartSaving') : t('addPartLog')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
