import { cn } from '#/lib/helpers';
import { AppleIcon } from '#/components/primitives/AppleIcon';

type AppleSignInButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  label?: string;
};

export function AppleSignInButton({
  onClick,
  disabled,
  loading,
  className,
  label = 'Sign in with Apple',
}: AppleSignInButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'flex items-center justify-center gap-3 w-full',
        'bg-black text-white font-medium text-sm',
        'border border-black rounded',
        'px-4 py-2.5',
        'transition-all duration-150',
        'hover:bg-zinc-900 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'cursor-pointer',
        className,
      )}
    >
      <span className='shrink-0 flex items-center justify-center'>
        <AppleIcon size={18} color='white' />
      </span>
      <span className='font-[-apple-system,BlinkMacSystemFont,"SF_Pro_Text",sans-serif]'>
        {label}
      </span>
    </button>
  );
}
