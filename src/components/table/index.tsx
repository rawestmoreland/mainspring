import { cn } from '#/lib/helpers';

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("bg-muted/40 px-3.5 py-2.5 text-left font-mono text-[9.5px] uppercase tracking-widest text-muted-foreground font-normal border-b border-border", className)}>
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
        'border-b border-border last:border-0 transition-colors',
        onClick && 'hover:bg-muted/50 cursor-pointer',
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
    <div className={cn('overflow-x-auto bg-card border border-border rounded', className)}>
      <table className="w-full border-collapse min-w-max">{children}</table>
    </div>
  );
}
