import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '#/hooks/user';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Field, FieldError, FieldGroup } from '#/components/ui/field';
import { UserApi } from '#/lib/api/user';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

const searchSchema = z.object({ from: z.string().optional() });

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { from } = Route.useSearch();
  const { mutateAsync: login, isPending, error } = useLogin();
  const [resetOpen, setResetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    await login(data);
    navigate({ to: from ?? '/', replace: true });
  };

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='w-full max-w-sm'>
        <div className='mb-8 text-center'>
          <h1 className='font-serif text-2xl font-bold text-primary mb-1'>
            Hairspring
          </h1>
          <p className='font-mono text-xs text-muted-foreground tracking-widest uppercase'>
            Sign in to your account
          </p>
        </div>

        <div className='bg-card border border-border rounded-xl shadow-sm p-6'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <FieldGroup>
              <Controller
                name='email'
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      autoComplete='email'
                      autoFocus
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='password'
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Label htmlFor='password'>Password</Label>
                    <Input
                      id='password'
                      type='password'
                      autoComplete='current-password'
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            {error && (
              <p className='text-sm text-destructive'>
                Invalid email or password.
              </p>
            )}

            <Button type='submit' className='w-full' disabled={isPending}>
              {isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className='mt-6 text-center font-mono text-xs text-muted-foreground'>
          No account?{' '}
          <Link to='/signup' className='text-primary hover:underline'>
            Create one
          </Link>
        </p>

        <div className='flex items-center justify-center mt-4'>
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogTrigger asChild>
              <button
                type='button'
                className='font-mono text-xs text-muted-foreground'
                onClick={() => setResetOpen(true)}
              >
                Forgot your password?
              </button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-sm'>
              <form
                className='space-y-4'
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSubmitting(true);
                  const formData = new FormData(e.currentTarget);
                  const email = formData.get('reset-email') as string;
                  if (!email) {
                    return;
                  }
                  try {
                    await UserApi.passwordReset(email);
                    toast.success(
                      'If an account exists for this email, you will receive instructions shortly',
                    );
                  } catch (error) {
                    toast.error('There was an error during the submission');
                  } finally {
                    setSubmitting(false);
                    setResetOpen(false);
                  }
                }}
              >
                <DialogHeader>
                  <DialogTitle>Password reset</DialogTitle>
                  <DialogDescription>
                    Please provide the email address for this account.
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <Label htmlFor='reset-email'>Email address</Label>
                    <Input
                      id='reset-email'
                      name='reset-email'
                      placeholder='bob@example.com'
                    />
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant='outline' disabled={submitting}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type='submit' disabled={submitting}>
                    <Loader2
                      className={
                        submitting ? 'block animate-spin mr-2' : 'hidden'
                      }
                    />
                    {submitting ? 'Submitting' : 'Submit'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
