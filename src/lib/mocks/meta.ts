export const STAGE_META: Record<string, { label: string; className: string }> =
  {
    before: {
      label: 'Before',
      className:
        'bg-[rgba(166,124,46,0.12)] text-[#6d4512] border-[rgba(166,124,46,0.3)]',
    },
    during: {
      label: 'During',
      className:
        'bg-[rgba(31,89,138,0.10)] text-[#2c4a6b] border-[rgba(31,89,138,0.25)]',
    },
    after: {
      label: 'After',
      className:
        'bg-[rgba(45,87,58,0.12)] text-[#3a5a3a] border-[rgba(45,87,58,0.28)]',
    },
    listing: {
      label: 'Listing',
      className:
        'bg-[rgba(90,58,90,0.10)] text-[#5a3a5a] border-[rgba(90,58,90,0.25)]',
    },
  };

export const STATUS_META: Record<string, { label: string; className: string }> =
  {
    sold: {
      label: 'Sold',
      className:
        'bg-[rgba(45,87,58,0.10)] text-[#3a5a3a] border-[rgba(45,87,58,0.22)]',
    },
    in_progress: {
      label: 'In Progress',
      className:
        'bg-[rgba(166,124,46,0.10)] text-[#6d4512] border-[rgba(166,124,46,0.25)]',
    },
    listed: {
      label: 'Listed',
      className:
        'bg-[rgba(31,89,138,0.08)] text-[#2c4a6b] border-[rgba(31,89,138,0.20)]',
    },
    acquired: {
      label: 'Acquired',
      className:
        'bg-[rgba(90,58,90,0.08)] text-[#5a3a5a] border-[rgba(90,58,90,0.20)]',
    },
    paused: {
      label: 'Paused',
      className:
        'bg-[rgba(60,55,46,0.06)] text-[#6b5a45] border-[rgba(34,26,18,0.14)]',
    },
    kept: {
      label: 'Kept',
      className:
        'bg-[rgba(100,100,100,0.08)] text-[#4a4a4a] border-[rgba(100,100,100,0.14)]',
    },
  };
