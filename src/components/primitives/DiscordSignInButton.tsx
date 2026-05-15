import { cn } from '#/lib/helpers';
import { DiscordIcon } from '#/components/primitives/DiscordIcon';

type DiscordSignInButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  label?: string;
};

export function DiscordSignInButton({
  onClick,
  disabled,
  loading,
  className,
  label = 'Sign in with Discord',
}: DiscordSignInButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'flex items-center justify-center gap-3 w-full',
        'bg-[#5865F2] text-white font-medium text-sm',
        'border border-[#5865F2] rounded',
        'px-4 py-2.5',
        'transition-all duration-150',
        'hover:bg-[#4752c4] hover:border-[#4752c4] hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'cursor-pointer',
        className,
      )}
    >
      <span className='shrink-0 flex items-center justify-center'>
        <DiscordIcon size={20} color='white' />
      </span>
      <span>{label}</span>
    </button>
  );
}
