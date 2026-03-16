import { cn } from '#/lib/helpers';

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="bg-zinc-900 px-3.5 py-2.5 text-left font-mono text-[9.5px] uppercase tracking-widest text-zinc-500 font-normal border-b border-zinc-800">
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-3.5 py-2.5 text-sm align-middle', className)}>
      {children}
    </td>
  );
}

export function TableRow({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-zinc-800 last:border-0 transition-colors',
        onClick && 'hover:bg-white/[0.025] cursor-pointer',
      )}
    >
      {children}
    </tr>
  );
}

export function TableWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-zinc-900 border border-zinc-800 rounded overflow-hidden', className)}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}
