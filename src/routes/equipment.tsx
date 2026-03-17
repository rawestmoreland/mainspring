import { createFileRoute } from '@tanstack/react-router';
import { fmt } from '#/lib/helpers';
import { KpiCard } from '#/components/primitives/KpiCard';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { Btn } from '#/components/primitives/Button';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { useEquipment } from '#/hooks/equipment';
import { format } from 'date-fns';

export const Route = createFileRoute('/equipment')({
  component: EquipmentPage,
});

function EquipmentPage() {
  const { data: equipment, isLoading } = useEquipment();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!equipment) {
    return <div>No equipment found</div>;
  }

  const total = equipment.reduce((s, e) => s + e.cost, 0);

  return (
    <>
      <div className='grid grid-cols-2 gap-4 mb-7'>
        <KpiCard label='Tools Owned' value={equipment.length} />
        <KpiCard
          highlight
          label='Total Invested'
          value={fmt(total)}
          valueClass='text-primary'
          sub='one-time capex'
        />
      </div>

      <div className='flex items-center justify-between mb-3.5'>
        <SectionLabel>Tools &amp; Equipment</SectionLabel>
        <Btn sm>+ Add Tool</Btn>
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Tool / Equipment</Th>
            <Th>Date Acquired</Th>
            <Th>Cost</Th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((e) => (
            <TableRow key={e.id}>
              <Td className='font-medium text-sm'>{e.name}</Td>
              <Td className='font-mono text-xs text-muted-foreground'>
                {format(e.date_acquired, 'MM/dd/yyyy')}
              </Td>
              <Td className='font-mono text-xs'>{fmt(e.cost)}</Td>
            </TableRow>
          ))}
          <tr className='border-t-2 border-border'>
            <td
              colSpan={2}
              className='px-3.5 py-2.5 font-semibold text-sm text-foreground'
            >
              Total
            </td>
            <td className='px-3.5 py-2.5 font-mono text-xs text-primary font-semibold'>
              {fmt(total)}
            </td>
          </tr>
        </tbody>
      </TableWrap>
    </>
  );
}
