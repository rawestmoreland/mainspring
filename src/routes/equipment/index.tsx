import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { fmt } from '#/lib/helpers';
import { KpiCard } from '#/components/primitives/KpiCard';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { useEquipment } from '#/hooks/equipment';
import { format } from 'date-fns';
import { useUser } from '#/hooks/user';
import { Button } from '#/components/ui/button';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { EquipmentSkeleton } from '#/components/skeletons';

export const Route = createFileRoute('/equipment/')({
  component: EquipmentPage,
});

function EquipmentPage() {
  const { t } = useTranslation();
  const { data: equipment, isPending } = useEquipment();

  const { data: user, isPending: isUserPending } = useUser();

  if (isPending || isUserPending) {
    return <EquipmentSkeleton />;
  }
  if (!equipment) {
    return <div>{t('equipmentNotFound')}</div>;
  }

  const total = equipment.reduce((s, e) => s + e.cost, 0);

  return (
    <>
      <div className='grid grid-cols-2 gap-4 mb-7'>
        <KpiCard label={t('equipmentToolsOwned')} value={equipment.length} />
        <KpiCard
          highlight
          label={t('equipmentTotalInvested')}
          value={fmt(total)}
          valueClass='text-primary'
          sub={t('equipmentCapexSub')}
        />
      </div>

      <div className='flex items-center justify-between mb-3.5'>
        <SectionLabel>{t('toolsEquipment')}</SectionLabel>
        {user && (
          <Button asChild>
            <Link to='/equipment/new'>
              <PlusIcon className='size-3' />
              {t('addTool')}
            </Link>
          </Button>
        )}
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>{t('equipmentColTool')}</Th>
            <Th>{t('equipmentDateAcquired')}</Th>
            <Th>{t('colCost')}</Th>
            <Th>{''}</Th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((e) => (
            <TableRow key={e.id}>
              <Td className='font-medium text-sm'>{e.name}</Td>
              <Td className='font-mono text-xs text-muted-foreground'>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                {format(e.date_acquired, 'MM/dd/yyyy')}
              </Td>
              <Td className='font-mono text-xs'>{fmt(e.cost)}</Td>
              <Td className='w-8 text-right'>
                {user && (
                  <Link
                    to='/equipment/$equipmentId/edit'
                    params={{ equipmentId: e.id }}
                    className='inline-flex items-center justify-center size-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
                  >
                    <PencilIcon className='size-3' />
                  </Link>
                )}
              </Td>
            </TableRow>
          ))}
          <tr className='border-t-2 border-border'>
            <td
              colSpan={2}
              className='px-3.5 py-2.5 font-semibold text-sm text-foreground'
            >
              {t('total')}
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
