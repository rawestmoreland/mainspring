import { cn } from '#/lib/helpers';

export function Btn({
  children,
  onClick,
  ghost,
  sm,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ghost: boolean;
  sm: boolean;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded font-semibold tracking-wide transition-opacity hover:opacity-80 cursor-pointer',
        ghost
          ? 'bg-transparent text-zinc-400 border border-zinc-700 hover:text-zinc-200 hover:border-zinc-500'
          : 'bg-amber-600 text-zinc-950',
        sm ? 'px-2.5 py-1 text-[11px]' : 'px-4 py-2 text-xs',
        className,
      )}
    >
      {children}
    </button>
  );
}
