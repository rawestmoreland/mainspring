import { Skeleton } from '#/components/ui/skeleton';
import { TableWrap, Th } from '#/components/table';

function KpiCardSkeleton() {
  return (
    <div className='bg-card border border-border rounded-lg p-4'>
      <Skeleton className='h-3 w-24 mb-3' />
      <Skeleton className='h-7 w-32 mb-2' />
      <Skeleton className='h-2.5 w-20' />
    </div>
  );
}

function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className='px-3.5 py-2.5'>
          <Skeleton className='h-3.5 w-full' />
        </td>
      ))}
    </tr>
  );
}

function SectionLabelSkeleton() {
  return <Skeleton className='h-3 w-28' />;
}

export function DashboardSkeleton() {
  return (
    <>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7'>
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      <div className='flex items-center justify-between mb-3.5'>
        <SectionLabelSkeleton />
        <Skeleton className='h-7 w-24 rounded' />
      </div>
      <TableWrap className='mb-7'>
        <thead>
          <tr>
            {Array.from({ length: 9 }).map((_, i) => (
              <Th key={i}>
                <Skeleton className='h-2.5 w-12' />
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRowSkeleton key={i} cols={9} />
          ))}
        </tbody>
      </TableWrap>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <div className='flex items-center justify-between mb-3.5'>
            <SectionLabelSkeleton />
            <Skeleton className='h-7 w-20 rounded' />
          </div>
          <TableWrap>
            <thead>
              <tr>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Th key={i}>
                    <Skeleton className='h-2.5 w-10' />
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={4} />
              ))}
            </tbody>
          </TableWrap>
        </div>

        <div>
          <div className='flex items-center justify-between mb-3.5'>
            <SectionLabelSkeleton />
            <Skeleton className='h-7 w-20 rounded' />
          </div>
          <div className='bg-card border border-border rounded overflow-hidden'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className='flex justify-between items-center px-3.5 py-2.5 border-b border-border last:border-0'
              >
                <Skeleton className='h-3 w-32' />
                <Skeleton className='h-3 w-16' />
              </div>
            ))}
            <div className='flex justify-between items-center px-3.5 py-2.5 border-t-2 border-border'>
              <Skeleton className='h-3 w-10' />
              <Skeleton className='h-3 w-16' />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function WatchesListSkeleton() {
  return (
    <>
      <div className='flex gap-0.5 mb-5'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-7 w-20 rounded' />
        ))}
        <Skeleton className='h-7 w-24 rounded ml-auto' />
      </div>

      <TableWrap>
        <thead>
          <tr>
            {Array.from({ length: 10 }).map((_, i) => (
              <Th key={i}>
                <Skeleton className='h-2.5 w-12' />
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRowSkeleton key={i} cols={10} />
          ))}
        </tbody>
      </TableWrap>
    </>
  );
}

export function InventorySkeleton() {
  return (
    <>
      <div className='grid grid-cols-3 gap-4 mb-7'>
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      <div className='flex items-center justify-between mb-3.5'>
        <SectionLabelSkeleton />
        <Skeleton className='h-7 w-24 rounded' />
      </div>

      <TableWrap>
        <thead>
          <tr>
            {Array.from({ length: 6 }).map((_, i) => (
              <Th key={i}>
                <Skeleton className='h-2.5 w-12' />
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRowSkeleton key={i} cols={6} />
          ))}
        </tbody>
      </TableWrap>
    </>
  );
}

export function EquipmentSkeleton() {
  return (
    <>
      <div className='grid grid-cols-2 gap-4 mb-7'>
        {Array.from({ length: 2 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      <div className='flex items-center justify-between mb-3.5'>
        <SectionLabelSkeleton />
        <Skeleton className='h-7 w-24 rounded' />
      </div>

      <TableWrap>
        <thead>
          <tr>
            {Array.from({ length: 4 }).map((_, i) => (
              <Th key={i}>
                <Skeleton className='h-2.5 w-12' />
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRowSkeleton key={i} cols={4} />
          ))}
          <tr className='border-t-2 border-border'>
            <td colSpan={2} className='px-3.5 py-2.5'>
              <Skeleton className='h-3 w-10' />
            </td>
            <td className='px-3.5 py-2.5'>
              <Skeleton className='h-3 w-16' />
            </td>
            <td />
          </tr>
        </tbody>
      </TableWrap>
    </>
  );
}

export function PublicProfileSkeleton() {
  return (
    <div className='min-h-screen'>
      <header className='fixed top-0 inset-x-0 z-50 h-14 flex items-center gap-3 px-5 border-b border-border bg-background/90 backdrop-blur-md'>
        <Skeleton className='h-4 w-20' />
        <span className='text-border'>·</span>
        <Skeleton className='h-3 w-24' />
      </header>

      <div className='max-w-3xl mx-auto px-5 pt-24 pb-16'>
        {/* Profile header */}
        <div className='flex items-center gap-4 mb-8 pb-7 border-b border-border'>
          <Skeleton className='w-11 h-11 rounded-full shrink-0' />
          <div className='flex-1'>
            <Skeleton className='h-5 w-40 mb-1.5' />
            <Skeleton className='h-3 w-64 mb-2' />
            <div className='flex items-center gap-2'>
              <Skeleton className='h-2.5 w-16' />
              <span className='text-border'>·</span>
              <Skeleton className='h-2.5 w-20' />
            </div>
          </div>
        </div>

        {/* Section label */}
        <Skeleton className='h-3 w-28 mb-5' />

        {/* Watch project cards */}
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='bg-card border border-border rounded overflow-hidden'>
              <div className='flex items-start justify-between gap-3 px-3.5 py-3 border-b border-border bg-muted/40'>
                <div>
                  <Skeleton className='h-4 w-36 mb-1.5' />
                  <Skeleton className='h-2.5 w-24' />
                </div>
                <Skeleton className='h-2.5 w-10 mt-0.5' />
              </div>
              {Array.from({ length: 2 }).map((_, j) => (
                <div
                  key={j}
                  className='flex justify-between items-center px-3.5 py-2.5 border-b border-border last:border-0'
                >
                  <Skeleton className='h-3 w-48' />
                  <Skeleton className='h-3 w-16' />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className='max-w-3xl'>
      <Skeleton className='h-3 w-20 mb-6' />

      <Skeleton className='h-6 w-48 mb-1.5' />
      <Skeleton className='h-3 w-64 mb-8' />

      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div className='flex flex-col gap-1.5'>
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-9 w-full rounded-md' />
        </div>
        <div className='flex flex-col gap-1.5'>
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-9 w-full rounded-md' />
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div className='flex flex-col gap-1.5'>
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-9 w-full rounded-md' />
        </div>
        <div className='flex flex-col gap-1.5'>
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-9 w-full rounded-md' />
        </div>
      </div>

      <div className='grid grid-cols-3 gap-4 mb-4'>
        <div className='flex flex-col gap-1.5'>
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-9 w-full rounded-md' />
        </div>
        <div className='flex flex-col gap-1.5'>
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-9 w-full rounded-md' />
        </div>
        <div className='flex flex-col gap-1.5'>
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-9 w-full rounded-md' />
        </div>
      </div>

      <div className='flex flex-col gap-1.5 mb-6'>
        <Skeleton className='h-3 w-12' />
        <Skeleton className='h-32 w-full rounded-md' />
      </div>

      <div className='flex gap-3'>
        <Skeleton className='h-9 w-28 rounded-md' />
        <Skeleton className='h-9 w-20 rounded-md' />
      </div>
    </div>
  );
}
