import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from 'lucide-react';

import type { DonorMovement, InventoryItem } from '#/types';
import { useCreateInventory, useInventory, useUpdateInventory } from '#/hooks/inventory';
import { useUpdateDonorMovement } from '#/hooks/donorMovements';
import { usePartVocabulary, useCreateMovementPart } from '#/hooks/movementParts';
import { PartTagInput } from '#/components/inventory/PartTagInput';
import { HarvestInventoryDialog } from '#/components/inventory/HarvestInventoryDialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet';

type DonorDetailPanelProps = {
  donor: DonorMovement | null;
  open: boolean;
  onClose: () => void;
};

export function DonorDetailPanel({ donor, open, onClose }: DonorDetailPanelProps) {
  const { t } = useTranslation();
  const { data: inventoryData } = useInventory();
  const createInventory = useCreateInventory();
  const updateInventory = useUpdateInventory();
  const updateDonorMovement = useUpdateDonorMovement();
  const createMovementPart = useCreateMovementPart();
  const vocabulary = usePartVocabulary();
  const [pendingNewParts, setPendingNewParts] = useState<string[]>([]);

  const inventory = (inventoryData ?? []) as unknown as InventoryItem[];

  function handlePartsChange(next: string[], prev: string[]) {
    if (!donor) return;
    const prevSet = new Set(prev);
    const newlyHarvested = next.filter((p) => !prevSet.has(p));
    if (newlyHarvested.length === 0) return;

    updateDonorMovement.mutate({ id: donor.id, data: { missing_parts: next } });
    setPendingNewParts(newlyHarvested);
  }

  function handleInventoryConfirm(selectedParts: string[]) {
    if (!donor) return;
    for (const partName of selectedParts) {
      const existing = inventory.find(
        (item) => item.name.toLowerCase() === partName.toLowerCase(),
      );
      if (existing) {
        updateInventory.mutate({ ...existing, qty: existing.qty + 1 });
      } else {
        createInventory.mutate({
          inventory: {
            name: partName,
            category: 'movement',
            qty: 1,
            unit_cost: 0,
            user: donor.user,
            notes: `Harvested from ${donor.caliber} (${donor.manufacturer})`,
          },
        });
      }
    }
    setPendingNewParts([]);
  }

  return (
    <>
    <HarvestInventoryDialog
      open={pendingNewParts.length > 0}
      parts={pendingNewParts}
      onConfirm={handleInventoryConfirm}
      onSkip={() => setPendingNewParts([])}
    />
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side='right'
        showCloseButton={false}
        className='w-90 sm:max-w-90 p-0 gap-0 overflow-y-auto'
      >
        {donor && (
          <>
            <SheetHeader className='px-4 py-3 border-b border-border sticky top-0 bg-popover z-10 gap-0'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0 flex-1'>
                  <SheetTitle className='font-serif font-semibold text-foreground text-base leading-tight'>
                    {donor.caliber}
                  </SheetTitle>
                  <p className='font-mono text-[10px] text-muted-foreground mt-0.5'>
                    {donor.manufacturer}{donor.jewels != null ? ` · ${donor.jewels}j` : ''}
                  </p>
                </div>
                <SheetClose asChild>
                  <button
                    className='shrink-0 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0.5 mt-0.5'
                    aria-label={t('closePanel')}
                  >
                    <XIcon className='size-4' />
                  </button>
                </SheetClose>
              </div>
            </SheetHeader>

            <div className='px-4 py-4'>
              <p className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5'>
                {t('donorHarvestParts')}
              </p>
              <p className='font-mono text-[10px] text-muted-foreground mb-3'>
                {t('donorHarvestPartsHint')}
              </p>
              <PartTagInput
                value={donor.missing_parts ?? []}
                onChange={(next) => handlePartsChange(next, donor.missing_parts ?? [])}
                vocabulary={vocabulary}
                onCreatePart={async (name) => {
                  await createMovementPart.mutateAsync(name);
                }}
                disabled={createInventory.isPending || updateInventory.isPending || updateDonorMovement.isPending}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
    </>
  );
}
