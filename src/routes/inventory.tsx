import { createFileRoute } from '@tanstack/react-router';
import { fmt } from '#/lib/helpers';
import { MOCK_INVENTORY } from '#/lib/mocks/mock_inventory';
import { KpiCard } from '#/components/primitives/KpiCard';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { Btn } from '#/components/primitives/Button';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { useInventory } from '#/hooks/inventory';

export const Route = createFileRoute('/inventory')({
  component: InventoryPage,
});

function InventoryPage() {
  const { data: inventory, isLoading } = useInventory();

  if (isLoading) {
    return <div>Loading...</div>;
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
          valueClass='text-amber-400'
        />
      </div>

      <div className='flex items-center justify-between mb-3.5'>
        <SectionLabel>Spare Parts</SectionLabel>
        <Btn sm>+ Add Part</Btn>
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Part Name</Th>
            <Th>Category</Th>
            <Th>Qty</Th>
            <Th>Unit Cost</Th>
            <Th>Total Value</Th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((i) => (
            <TableRow key={i.id}>
              <Td className='font-medium text-sm'>{i.name}</Td>
              <Td>
                <span className='font-mono text-[9px] uppercase tracking-widest text-zinc-500 px-1.5 py-0.5 border border-zinc-700 rounded'>
                  {i.category}
                </span>
              </Td>
              <Td className='font-mono text-xs'>{i.qty}</Td>
              <Td className='font-mono text-xs text-zinc-400'>
                {fmt(i.unit_cost, 2)}
              </Td>
              <Td className='font-mono text-xs'>
                {fmt(i.qty * i.unit_cost, 2)}
              </Td>
            </TableRow>
          ))}
        </tbody>
      </TableWrap>
    </>
  );
}
