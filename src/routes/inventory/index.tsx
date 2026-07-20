import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn, fmt } from '#/lib/helpers';
import { KpiCard } from '#/components/primitives/KpiCard';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { useDeleteInventory, useInventory } from '#/hooks/inventory';
import { useDonorMovements } from '#/hooks/donorMovements';
import { useUser } from '#/hooks/user';
import { Button } from '#/components/ui/button';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { InventorySkeleton } from '#/components/skeletons';
import { DonorDetailPanel } from '#/components/inventory/DonorDetailPanel';
import { LogPartUsageDialog } from '#/components/inventory/LogPartUsageDialog';
import { LocalStorageKeys } from '#/lib/constants';
import { useAuth } from '#/hooks/auth';

const getInitialFilter = () => {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(LocalStorageKeys.InventoryFilterKey);
  return stored ? JSON.parse(stored) : false;
};

export const Route = createFileRoute('/inventory/')({
  component: InventoryPage,
});

function InventoryPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [filterZeroQty, setFilterZeroQty] = useState(false);
  const { data: inventory, isPending: isInventoryPending } = useInventory();
  const deleteInventoryItem = useDeleteInventory();
  const { data: donorMovements = [], isPending: isDonorsPending } =
    useDonorMovements();
  const { data: user, isPending: isUserPending } = useUser();

  const [view, setView] = useState<'parts' | 'donors'>('parts');
  const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    if (!filterZeroQty) return inventory;
    return inventory.filter((i) => i.qty > 0);
  }, [filterZeroQty, inventory]);

  useEffect(() => {
    const storedFilter = getInitialFilter();
    setFilterZeroQty(storedFilter);
  }, [inventory]);

  if (isInventoryPending || isDonorsPending || isUserPending)
    return <InventorySkeleton />;
  if (!inventory) return <div>{t('inventoryNotFound')}</div>;

  const totalValue = inventory.reduce((s, i) => s + i.qty * i.unit_cost, 0);
  const selectedDonor =
    donorMovements.find((d) => d.id === selectedDonorId) ?? null;

  return (
    <>
      <div className='grid grid-cols-3 gap-4 mb-7'>
        <KpiCard label={t('inventoryTotalSkus')} value={inventory.length} />
        <KpiCard
          label={t('inventoryDonorMovements')}
          value={donorMovements.length}
        />
        <KpiCard
          highlight
          label={t('inventoryPartsValue')}
          value={fmt({
            n: totalValue,
            symbol: profile?.currency?.symbol ?? '',
          })}
          valueClass='text-primary'
        />
      </div>

      <div className='flex items-center gap-1 mb-5'>
        <button
          type='button'
          onClick={() => setView('parts')}
          className={cn(
            'px-3 py-1 rounded font-mono text-xs transition-colors cursor-pointer border',
            view === 'parts'
              ? 'bg-muted text-foreground border-border'
              : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-border',
          )}
        >
          {t('inventoryTabParts')}
        </button>
        <button
          type='button'
          onClick={() => setView('donors')}
          className={cn(
            'px-3 py-1 rounded font-mono text-xs transition-colors cursor-pointer border',
            view === 'donors'
              ? 'bg-muted text-foreground border-border'
              : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-border',
          )}
        >
          {t('inventoryDonorMovements')}
        </button>
      </div>

      {view === 'parts' ? (
        <>
          <div className='flex items-center justify-between mb-3.5'>
            <div className='flex items-center gap-4'>
              <SectionLabel>{t('inventorySpareParts')}</SectionLabel>
              <Button
                onClick={() => {
                  setFilterZeroQty((f) => {
                    localStorage.setItem(
                      LocalStorageKeys.InventoryFilterKey,
                      JSON.stringify(!f),
                    );
                    return !f;
                  });
                }}
                size='sm'
              >
                {filterZeroQty
                  ? t('inventoryShowAll')
                  : t('inventoryHideZeroQty')}
              </Button>
            </div>
            {user && (
              <Button asChild>
                <Link to='/inventory/new'>
                  <PlusIcon className='size-3' />
                  {t('addPart')}
                </Link>
              </Button>
            )}
          </div>

          <TableWrap>
            <thead>
              <tr>
                <Th>{t('inventoryColPartName')}</Th>
                <Th>{t('fieldCategory')}</Th>
                <Th>{t('colQty')}</Th>
                <Th>{t('fieldUnitCost')}</Th>
                <Th>{t('inventoryColTotalValue')}</Th>
                <Th>{''}</Th>
                <Th>{''}</Th>
                <Th>{''}</Th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((i) => (
                <TableRow key={i.id}>
                  <Td className='font-medium text-sm'>{i.name}</Td>
                  <Td>
                    <span className='font-mono text-[9px] uppercase tracking-widest text-muted-foreground px-1.5 py-0.5 border border-border rounded'>
                      {i.category.replace(/_/g, ' ')}
                    </span>
                  </Td>
                  <Td className='font-mono text-xs'>{i.qty}</Td>
                  <Td className='font-mono text-xs text-muted-foreground'>
                    {fmt({
                      n: i.unit_cost,
                      d: 2,
                      symbol: profile?.currency?.symbol ?? '',
                    })}
                  </Td>
                  <Td className='font-mono text-xs'>
                    {fmt({
                      n: i.qty * i.unit_cost,
                      d: 2,
                      symbol: profile?.currency?.symbol ?? '',
                    })}
                  </Td>
                  <Td className='w-8 text-right'>
                    {user && <LogPartUsageDialog item={i} />}
                  </Td>
                  <Td className='w-8 text-right'>
                    {user && (
                      <Button asChild variant='ghost' size='icon'>
                        <Link
                          to='/inventory/$inventoryId/edit'
                          params={{ inventoryId: i.id }}
                        >
                          <PencilIcon className='size-3' />
                        </Link>
                      </Button>
                    )}
                  </Td>
                  <Td className='w-8 text-right'>
                    {user && (
                      <Button
                        onClick={async () => {
                          if (window.confirm(t('inventoryDeleteConfirm'))) {
                            await deleteInventoryItem.mutateAsync(i.id);
                          }
                        }}
                        variant='ghost'
                        size='icon'
                      >
                        <Trash2Icon className='size-3' />
                      </Button>
                    )}
                  </Td>
                </TableRow>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className='px-3.5 py-8 text-center text-muted-foreground font-mono text-xs'
                  >
                    {t('inventoryNoPartsYet')}
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </>
      ) : (
        <>
          <div className='flex items-center justify-between mb-3.5'>
            <SectionLabel>{t('inventoryDonorMovements')}</SectionLabel>
            {user && (
              <Button asChild>
                <Link to='/inventory/new'>
                  <PlusIcon className='size-3' />
                  {t('inventoryAddDonor')}
                </Link>
              </Button>
            )}
          </div>

          <TableWrap>
            <thead>
              <tr>
                <Th>{t('fieldCaliber')}</Th>
                <Th>{t('fieldManufacturer')}</Th>
                <Th>{t('inventoryMissingParts')}</Th>
              </tr>
            </thead>
            <tbody>
              {donorMovements.map((d) => (
                <TableRow key={d.id} onClick={() => setSelectedDonorId(d.id)}>
                  <Td className='font-medium text-sm'>{d.caliber}</Td>
                  <Td className='font-mono text-xs text-muted-foreground'>
                    {d.manufacturer}
                  </Td>
                  <Td>
                    {d.missing_parts?.length ? (
                      <div className='flex flex-wrap gap-1'>
                        {d.missing_parts.map((p) => (
                          <span
                            key={p}
                            className='inline-block font-mono text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5'
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className='font-mono text-xs text-muted-foreground'>
                        —
                      </span>
                    )}
                  </Td>
                </TableRow>
              ))}
              {donorMovements.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className='px-3.5 py-8 text-center text-muted-foreground font-mono text-xs'
                  >
                    {t('inventoryNoDonorsYet')}
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </>
      )}

      <DonorDetailPanel
        donor={selectedDonor}
        open={!!selectedDonorId}
        onClose={() => setSelectedDonorId(null)}
      />
    </>
  );
}
