import { createFileRoute, Link } from '@tanstack/react-router';
import { fmt } from '#/lib/helpers';
import { KpiCard } from '#/components/primitives/KpiCard';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { useInventory } from '#/hooks/inventory';
import { useUser } from '#/hooks/user';
import { Button } from '#/components/ui/button';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { InventorySkeleton } from '#/components/skeletons';

export const Route = createFileRoute('/inventory/')({
  component: InventoryPage,
});

function InventoryPage() {
  const { data: inventory, isPending } = useInventory();

  const { data: user, isPending: isUserPending } = useUser();

  if (isPending || isUserPending) {
    return <InventorySkeleton />;
  }
  if (!inventory) {
    return <div>No inventory found</div>;
  }

  const totalUnits = inventory.reduce((s, i) => s + i.qty, 0);
  const totalValue = inventory.reduce((s, i) => s + i.qty * i.unit_cost, 0);

  return (
    <>
      <div className='grid grid-cols-3 gap-4 mb-7'>
        <KpiCard label='Total SKUs' value={inventory.length} />
        <KpiCard label='Total Units' value={totalUnits} />
        <KpiCard
          highlight
          label='Inventory Value'
          value={fmt(totalValue)}
          valueClass='text-primary'
        />
      </div>

      <div className='flex items-center justify-between mb-3.5'>
        <SectionLabel>Spare Parts</SectionLabel>
        {user && (
          <Button asChild>
            <Link to='/inventory/new'>
              <PlusIcon className='size-3' />
              Add Part
            </Link>
          </Button>
        )}
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Part Name</Th>
            <Th>Category</Th>
            <Th>Qty</Th>
            <Th>Unit Cost</Th>
            <Th>Total Value</Th>
            <Th>{''}</Th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((i) => (
            <TableRow key={i.id}>
              <Td className='font-medium text-sm'>{i.name}</Td>
              <Td>
                <span className='font-mono text-[9px] uppercase tracking-widest text-muted-foreground px-1.5 py-0.5 border border-border rounded'>
                  {i.category}
                </span>
              </Td>
              <Td className='font-mono text-xs'>{i.qty}</Td>
              <Td className='font-mono text-xs text-muted-foreground'>
                {fmt(i.unit_cost, 2)}
              </Td>
              <Td className='font-mono text-xs'>
                {fmt(i.qty * i.unit_cost, 2)}
              </Td>
              <Td className='w-8 text-right'>
                {user && (
                  <Link
                    to='/inventory/$inventoryId/edit'
                    params={{ inventoryId: i.id }}
                    className='inline-flex items-center justify-center size-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
                  >
                    <PencilIcon className='size-3' />
                  </Link>
                )}
              </Td>
            </TableRow>
          ))}
        </tbody>
      </TableWrap>
    </>
  );
}
