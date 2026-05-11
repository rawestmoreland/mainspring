import { useState } from 'react';
import { toast } from 'sonner';
import { startProCheckout } from '#/server/checkout-actions';
import { Button } from '#/components/ui/button';

declare global {
  interface Window {
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

export function UpgradeButton({ pbUserId }: { pbUserId: string }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const checkoutUrl = await startProCheckout({ data: pbUserId });

      if (window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(checkoutUrl);
      } else {
        window.open(checkoutUrl, '_blank');
      }
    } catch (err) {
      toast.error('Could not start checkout. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleUpgrade} disabled={loading}>
      {loading ? 'Loading…' : 'Upgrade'}
    </Button>
  );
}
