import { useState } from 'react';
import { toast } from 'sonner';
import { startProCheckout } from '#/server/checkout-actions';
import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { useLocation } from '@tanstack/react-router';

export function UpgradeButton({ pbUserId }: { pbUserId: string }) {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const url = await startProCheckout({
        data: { userId: pbUserId, pathname: location.pathname },
      });
      setCheckoutUrl(url);
    } catch (err) {
      toast.error('Could not start checkout. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleUpgrade} disabled={loading}>
        {loading ? 'Loading…' : 'Upgrade'}
      </Button>
      <Dialog
        open={!!checkoutUrl}
        onOpenChange={(open) => !open && setCheckoutUrl(null)}
      >
        <DialogContent className='max-w-2xl p-0 overflow-hidden'>
          <DialogHeader className='sr-only'>
            <DialogTitle>Upgrade to Pro</DialogTitle>
          </DialogHeader>
          {checkoutUrl && (
            <iframe
              src={checkoutUrl}
              className='w-full h-175 border-0'
              title='Checkout'
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
