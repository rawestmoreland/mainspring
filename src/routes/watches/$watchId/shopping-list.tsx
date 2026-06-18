import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LockIcon } from 'lucide-react';
import type { TFunction } from 'i18next';
import { useGetWatchById } from '#/hooks/watches';
import { useUser } from '#/hooks/user';
import {
  useGetPartsShoppingList,
  useCreatePartsShoppingItem,
  useUpdatePartsShoppingItem,
  useDeletePartsShoppingItem,
} from '#/hooks/watch-parts-shopping-list';
import { useSubscription } from '#/hooks/subscription';
import { UpgradeButton } from '#/components/primitives/UpgradeButton';
import { KpiCard } from '#/components/primitives/KpiCard';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { Field, FieldError, FieldLabel } from '#/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog';
import { Input } from '#/components/ui/input';
import { cn, fmt } from '#/lib/helpers';
import type { InventoryCategory, PartsShoppingStatus, WatchPartsShoppingItem } from '#/types';

export const Route = createFileRoute('/watches/$watchId/shopping-list')({
  component: ShoppingListPage,
});

function getCategoryLabels(t: TFunction): Record<InventoryCategory, string> {
  return {
    movement: t('categoryMovement'),
    harvested_part: t('categoryHarvestedPart'),
    mainspring: t('categoryMainspring'),
    crystal: t('categoryCrystal'),
    strap: t('categoryStrap'),
    bracelet: t('categoryBracelet'),
    crown: t('categoryCrown'),
    gasket: t('categoryGasket'),
    hand: t('categoryHand'),
    dial: t('categoryDial'),
    bezel: t('categoryBezel'),
    case: t('categoryCase'),
    tool: t('categoryTool'),
    oil: t('categoryOil'),
    other: t('categoryOther'),
  };
}

function getStatusLabels(t: TFunction): Record<PartsShoppingStatus, string> {
  return {
    needed: t('watchShoppingNeeded'),
    ordered: t('watchShoppingOrdered'),
    in_hand: t('watchShoppingInHand'),
  };
}

function statusClass(status: PartsShoppingStatus): string {
  if (status === 'needed') return 'bg-amber-500/15 text-[#6d4512] border-amber-500/30';
  if (status === 'ordered') return 'bg-blue-500/15 text-[#2c4a6b] border-blue-500/30';
  return 'bg-green-500/15 text-[#3a5a3a] border-green-500/30';
}

const PARTS_STATUSES: PartsShoppingStatus[] = ['needed', 'ordered', 'in_hand'];

function PartsStatusPicker({
  item,
  watchId,
}: {
  item: WatchPartsShoppingItem;
  watchId: string;
}) {
  const { t } = useTranslation();
  const statusLabels = getStatusLabels(t);
  const [open, setOpen] = useState(false);
  const updateItem = useUpdatePartsShoppingItem(watchId);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-75 bg-transparent',
            statusClass(item.status),
          )}
        >
          {statusLabels[item.status]}
        </button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-xs'>
        <DialogHeader>
          <DialogTitle className='font-mono text-sm font-medium'>
            {t('wishlistUpdateStatus')}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-1.5 py-1'>
          {PARTS_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                updateItem.mutate({ id: item.id, data: { status: s } });
                setOpen(false);
              }}
              disabled={updateItem.isPending || item.status === s}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors cursor-pointer bg-transparent',
                item.status === s
                  ? 'border-amber-500/40 bg-amber-500/5 cursor-default'
                  : 'border-border hover:bg-white/5',
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest',
                  statusClass(s),
                )}
              >
                {statusLabels[s]}
              </span>
              {item.status === s && (
                <span className='font-mono text-[10px] text-muted-foreground'>
                  {t('wishlistCurrent')}
                </span>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const schema = z.object({
  name: z.string().min(1, 'Required'),
  category: z.string().optional(),
  target_price: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

function AddItemForm({
  watchId,
  userId,
  onSuccess,
  onCancel,
}: {
  watchId: string;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const categoryLabels = getCategoryLabels(t);
  const createItem = useCreatePartsShoppingItem(watchId);
  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await createItem.mutateAsync({
      user: userId,
      watch: watchId,
      name: data.name,
      category: (data.category as InventoryCategory) || undefined,
      target_price: data.target_price ? parseFloat(data.target_price) : undefined,
      notes: data.notes || undefined,
      status: 'needed',
    });
    reset();
    onSuccess();
  };

  const inputCls =
    'w-full rounded border border-input bg-background px-2.5 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
        <div className='sm:col-span-2'>
          <Controller
            name='name'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='name'>{t('shoppingListPartName')}</FieldLabel>
                <Input
                  {...field}
                  id='name'
                  placeholder={t('shoppingListPlaceholderPart')}
                  aria-invalid={fieldState.invalid}
                  className={inputCls}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div>
          <Controller
            name='category'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='category'>{t('fieldCategory')}</FieldLabel>
                <Select
                  name={field.name}
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id='category' className={inputCls}>
                    <SelectValue placeholder={t('optional')} />
                  </SelectTrigger>
                  <SelectContent position='popper'>
                    {(Object.keys(categoryLabels) as InventoryCategory[]).map(
                      (cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoryLabels[cat]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div>
          <Controller
            name='target_price'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='target_price'>{t('shoppingListTargetPriceCol')}</FieldLabel>
                <Input
                  {...field}
                  id='target_price'
                  type='number'
                  step='0.01'
                  placeholder={t('optional')}
                  aria-invalid={fieldState.invalid}
                  className={inputCls}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </div>
      <div>
        <Controller
          name='notes'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='notes'>{t('fieldNotes')}</FieldLabel>
              <Input
                {...field}
                id='notes'
                placeholder={t('shoppingListPlaceholderNotes')}
                aria-invalid={fieldState.invalid}
                className={inputCls}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </div>
      <div className='flex gap-3'>
        <button
          type='submit'
          disabled={createItem.isPending}
          className='inline-flex items-center rounded-md bg-primary px-4 py-2 text-xs font-mono text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity'
        >
          {createItem.isPending ? t('shoppingListAddingItem') : t('shoppingListAddItem')}
        </button>
        <button
          type='button'
          onClick={onCancel}
          className='inline-flex items-center rounded-md border border-border px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors bg-transparent cursor-pointer'
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

function ShoppingListPage() {
  const { t } = useTranslation();
  const categoryLabels = getCategoryLabels(t);
  const { watchId } = Route.useParams();
  const { data: watch, isLoading: watchLoading } = useGetWatchById(watchId);
  const { data: items = [], isLoading: itemsLoading } =
    useGetPartsShoppingList(watchId);
  const { data: user } = useUser();
  const { isPro } = useSubscription();
  const deleteItem = useDeletePartsShoppingItem(watchId);

  const [showForm, setShowForm] = useState(false);

  if (watchLoading || itemsLoading) {
    return (
      <div className='text-sm font-mono text-muted-foreground'>{t('loading')}</div>
    );
  }

  if (!watch) {
    return (
      <div className='space-y-3'>
        <Link
          to='/watches'
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          {t('backToWatches')}
        </Link>
        <div className='text-sm text-red-400 font-mono'>{t('watchNotFound')}</div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className='space-y-5 min-w-0'>
        <Link
          to='/watches/$watchId'
          params={{ watchId }}
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          {t('backToWatch')}
        </Link>
        <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card px-8 py-16 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10'>
            <LockIcon className='h-5 w-5 text-amber-400' />
          </div>
          <div className='space-y-1'>
            <h2 className='font-serif font-semibold text-foreground'>
              {t('shoppingListTitle')}
            </h2>
            <p className='font-mono text-xs text-muted-foreground max-w-xs'>
              {t('shoppingListProDesc')}
            </p>
          </div>
          {user && <UpgradeButton pbUserId={user.id} />}
        </div>
      </div>
    );
  }

  const needed = items.filter((i) => i.status === 'needed').length;
  const ordered = items.filter((i) => i.status === 'ordered').length;
  const inHand = items.filter((i) => i.status === 'in_hand').length;
  const totalTargetValue = items.reduce(
    (sum, i) => sum + (i.target_price ?? 0),
    0,
  );

  return (
    <div className='space-y-5 min-w-0'>
      <Link
        to='/watches/$watchId'
        params={{ watchId }}
        className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
      >
        {t('backToWatch')}
      </Link>

      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-serif font-semibold text-foreground'>
            {watch.make} {watch.model}
          </h1>
          <div className='mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground'>
            <span>{watch.reference}</span>
            <span className='text-muted-foreground/40'>·</span>
            <StatusBadge status={watch.status} />
          </div>
        </div>
        {user && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className='inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-mono text-primary-foreground hover:opacity-90 transition-opacity'
          >
            {t('shoppingListAddItemBtn')}
          </button>
        )}
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        <KpiCard highlight label={t('watchShoppingNeeded')} value={needed} sub={t('shoppingListToSource')} />
        <KpiCard label={t('watchShoppingOrdered')} value={ordered} sub={t('shoppingListInTransit')} />
        <KpiCard label={t('watchShoppingInHand')} value={inHand} sub={t('shoppingListReceived')} />
        <KpiCard
          label={t('shoppingListTargetValue')}
          value={fmt(totalTargetValue)}
          sub={t('shoppingListEstimatedCost')}
        />
      </div>

      {showForm && user && (
        <div className='rounded-xl border border-border bg-card p-5'>
          <SectionLabel>{t('shoppingListNewItem')}</SectionLabel>
          <div className='mt-3'>
            <AddItemForm
              watchId={watchId}
              userId={user.id}
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      <div>
        <SectionLabel>
          {t('shoppingListPartsCount', { count: items.length })}
        </SectionLabel>
        <div className='mt-3'>
          {items.length === 0 ? (
            <div className='rounded-xl border border-border bg-card px-5 py-8 text-center font-mono text-xs text-muted-foreground'>
              {t('shoppingListEmpty')}{' '}
              {user && (
                <button
                  onClick={() => setShowForm(true)}
                  className='text-primary hover:text-primary/80 bg-transparent border-none cursor-pointer font-mono text-xs p-0'
                >
                  {t('watchAddFirstShoppingItem')}
                </button>
              )}
            </div>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>{t('shoppingListPartCol')}</Th>
                  <Th>{t('fieldCategory')}</Th>
                  <Th>{t('shoppingListTargetPriceCol')}</Th>
                  <Th>{t('fieldNotes')}</Th>
                  <Th>{t('colStatus')}</Th>
                  {user && <Th>{''}</Th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <Td className='font-mono text-[11px] text-foreground'>
                      {item.name}
                    </Td>
                    <Td className='font-mono text-[11px] text-muted-foreground'>
                      {item.category
                        ? categoryLabels[item.category]
                        : '—'}
                    </Td>
                    <Td className='font-mono text-[11px] text-foreground'>
                      {item.target_price != null ? fmt(item.target_price) : '—'}
                    </Td>
                    <Td className='font-mono text-[11px] text-muted-foreground max-w-48 truncate'>
                      {item.notes ?? '—'}
                    </Td>
                    <Td>
                      <PartsStatusPicker item={item} watchId={watchId} />
                    </Td>
                    {user && (
                      <Td>
                        <button
                          onClick={() => {
                            if (confirm(t('shoppingListDeleteConfirm'))) {
                              deleteItem.mutate(item.id);
                            }
                          }}
                          className='text-muted-foreground hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer text-base leading-none p-0'
                          aria-label={t('shoppingListDeleteAriaLabel')}
                        >
                          ×
                        </button>
                      </Td>
                    )}
                  </TableRow>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>
      </div>
    </div>
  );
}
