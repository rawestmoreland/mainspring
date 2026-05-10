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
        {loading ? (
          <svg
            className='animate-spin'
            xmlns='http://www.w3.org/2000/svg'
            width={18}
            height={18}
            viewBox='0 0 24 24'
            fill='none'
            stroke='#4285F4'
            strokeWidth={2.5}
            strokeLinecap='round'
          >
            <path d='M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' />
          </svg>
        ) : (
          <GoogleIcon size={18} />
        )}
      </span>
      <span className='font-["Google_Sans",Roboto,Arial,sans-serif]'>
        {loading ? 'Signing in…' : label}
      </span>
    </button>
  );
}
