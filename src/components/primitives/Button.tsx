import { cn } from '#/lib/helpers';

type BtnProps = {
  children: React.ReactNode;
  onClick?: () => void;
  ghost?: boolean;
  sm?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

export function Btn({ children, onClick, ghost, sm, className, type = 'button', disabled }: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded font-semibold tracking-wide transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
        ghost
          ? 'bg-transparent text-muted-foreground border border-border hover:text-foreground hover:border-ring'
          : 'bg-primary text-primary-foreground',
        sm ? 'px-2.5 py-1 text-[11px]' : 'px-4 py-2 text-xs',
        className,
      )}
    >
      {children}
    </button>
  );
}
