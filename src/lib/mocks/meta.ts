export const STAGE_META: Record<string, { label: string; className: string }> =
  {
    before: {
      label: 'Before',
      className: 'bg-red-500/15 text-red-400 border-red-400/30',
    },
    during: {
      label: 'During',
      className: 'bg-amber-500/15 text-amber-400 border-amber-400/30',
    },
    after: {
      label: 'After',
      className: 'bg-green-500/15 text-green-400 border-green-400/30',
    },
    listing: {
      label: 'Listing',
      className: 'bg-blue-400/15 text-blue-400 border-blue-400/30',
    },
  };

export const STATUS_META: Record<string, { label: string; className: string }> =
  {
    sold: { label: 'Sold', className: 'bg-green-500/10 text-green-400' },
    in_progress: {
      label: 'In Progress',
      className: 'bg-amber-500/10 text-amber-400',
    },
    listed: { label: 'Listed', className: 'bg-blue-400/10 text-blue-400' },
    acquired: {
      label: 'Acquired',
      className: 'bg-violet-400/10 text-violet-400',
    },
  };
