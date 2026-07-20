import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns/format';
import { LucideClockPlus } from 'lucide-react';
import { useWatches } from '#/hooks/watches';
import { useLogPartUsage } from '#/hooks/parts_used';
import { Button } from '#/components/ui/button';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip';
import type { Inventory } from '#/types';

const schema = z.object({
  watch: z.string().min(1, 'Select a watch'),
  qty_used: z.number({ error: 'Required' }).int().min(1, 'Must be at least 1'),
  date_used: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  item: Inventory;
};

export function LogPartUsageDialog({ item }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: watches = [] } = useWatches();
  const activeWatches = watches
    .filter((w) => w.status !== 'archived')
    .sort((a, b) =>
      `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`),
    );
  const logPartUsage = useLogPartUsage();

  const today = format(new Date(), 'yyyy-MM-dd');

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      watch: '',
      qty_used: 1,
      date_used: today,
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (data.qty_used > item.qty) {
      setError('qty_used', {
        message: t('logUsageQtyExceedsStock', { qty: item.qty }),
      });
      return;
    }
    await logPartUsage.mutateAsync({
      watch: data.watch,
      inventory_item: item.id,
      qty_used: data.qty_used,
      date_used: data.date_used,
      notes: data.notes || undefined,
    });
    reset({ watch: '', qty_used: 1, date_used: today, notes: '' });
    setOpen(false);
  };

  const disabled = item.qty <= 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <DialogTrigger asChild>
              <Button variant='ghost' size='icon' disabled={disabled}>
                <LucideClockPlus className='size-3' />
              </Button>
            </DialogTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className='font-mono text-xs'>
            {disabled ? t('logUsageBtnDisabledStock') : t('logUsageBtn')}
          </p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {t('logUsageDialogTitle', { name: item.name })}
          </DialogTitle>
        </DialogHeader>
        <form
          id='log-part-usage-form'
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-4 pt-1'
        >
          <Controller
            name='watch'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='watch'>{t('logUsageWatch')}</FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id='watch'
                    aria-invalid={fieldState.invalid}
                    className='w-full'
                  >
                    <SelectValue placeholder={t('logUsageSelectWatch')} />
                  </SelectTrigger>
                  <SelectContent position='popper'>
                    {activeWatches.length === 0 ? (
                      <div className='px-2 py-1.5 font-mono text-xs text-muted-foreground'>
                        {t('logUsageNoWatches')}
                      </div>
                    ) : (
                      activeWatches.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.make} {w.model}
                          {w.reference && (
                            <span className='ml-1.5 text-muted-foreground text-[11px]'>
                              ({w.reference})
                            </span>
                          )}
                        </SelectItem>
                      ))
                    )}
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
                  <FieldLabel htmlFor='qty_used'>
                    {t('addPartQtyUsed')}
                  </FieldLabel>
                  <Input
                    {...field}
                    id='qty_used'
                    type='number'
                    step='1'
                    min={1}
                    max={item.qty}
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
                  <FieldLabel htmlFor='date_used'>
                    {t('addPartDate')}
                  </FieldLabel>
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
                  {t('addPartNotes')}{' '}
                  <span className='text-muted-foreground font-normal'>
                    {t('addPartNotesOptional')}
                  </span>
                </FieldLabel>
                <textarea
                  {...field}
                  id='notes'
                  rows={2}
                  placeholder={t('addPartPlaceholderNotes')}
                  className='w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'
                />
              </Field>
            )}
          />
        </form>
        <DialogFooter showCloseButton>
          <Button
            type='submit'
            form='log-part-usage-form'
            disabled={
              isSubmitting ||
              logPartUsage.isPending ||
              activeWatches.length === 0
            }
          >
            {logPartUsage.isPending ? t('addPartSaving') : t('addPartLog')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
