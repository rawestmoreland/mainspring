import { use, useEffect, useState } from 'react';
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
import { useGoogleAnalytics } from 'tanstack-router-ga4';

export function UpgradeButton({ pbUserId }: { pbUserId: string }) {
  const ga4 = useGoogleAnalytics();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (!measurementId) return;

    const attemptFetch = () => {
      try {
        // useGoogleAnalytics exposes standard GA4 command wrappers, including 'get'
        ga4.get(measurementId, 'client_id', (id?: string) => {
          if (id) {
            setClientId(id);
            clearInterval(intervalId); // Stop polling once successfully retrieved
          }
        });
      } catch (e) {
        // Quietly catch errors if the underlying gtag script isn't injected yet
      }
    };

    // Run immediately on mount
    attemptFetch();

    // Poll every 400ms to catch the exact moment the deferred GA script finishes loading
    intervalId = setInterval(attemptFetch, 400);

    return () => clearInterval(intervalId);
  }, [ga4, measurementId]);

  useEffect(() => {
    if (checkoutUrl) {
      ga4.event('upgrade_modal_viewed', {
        category: 'Subscription',
        label: 'Checkout iframe displayed',
        userInfo: { userId: pbUserId },
      });
    }
  }, [checkoutUrl]);

  const handleUpgrade = async () => {
    setLoading(true);
    ga4.event('begin_checkout', {
      category: 'Subscription',
      label: 'User initiated upgrade to Pro',
      userInfo: {
        userId: pbUserId,
      },
    });
    try {
      const url = await startProCheckout({
        data: {
          userId: pbUserId,
          pathname: location.pathname,
          gaClientId: clientId ?? 'unknown',
        },
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
        onOpenChange={(open) => {
          if (!open) {
            ga4.event('checkout_dismissed', {
              category: 'Subscription',
              label: 'User closed checkout without completing',
              userInfo: { userId: pbUserId },
            });
            setCheckoutUrl(null);
          }
        }}
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
