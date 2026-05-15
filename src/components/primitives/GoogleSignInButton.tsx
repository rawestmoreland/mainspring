import { cn } from '#/lib/helpers';
import { GoogleIcon } from '#/components/primitives/GoogleIcon';

type GoogleSignInButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  label?: string;
};

export function GoogleSignInButton({
  onClick,
  disabled,
  loading,
  className,
  label = 'Sign in with Google',
}: GoogleSignInButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'flex items-center justify-center gap-3 w-full',
        'bg-white text-[#1f1f1f] font-medium text-sm',
        'border border-[#dadce0] rounded',
        'px-4 py-2.5',
        'transition-all duration-150',
        'hover:bg-[#f8f9fa] hover:border-[#c6c9cc] hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'cursor-pointer',
        className,
      )}
    >
      <span className='shrink-0 flex items-center justify-center'>
        <GoogleIcon size={18} />
      </span>
      <span className='font-["Google_Sans",Roboto,Arial,sans-serif]'>
        {label}
      </span>
    </button>
  );
}
