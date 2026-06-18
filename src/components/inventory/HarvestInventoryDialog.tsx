import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { Button } from '#/components/ui/button';

type HarvestInventoryDialogProps = {
  open: boolean;
  parts: string[];
  onConfirm: (selectedParts: string[]) => void;
  onSkip: () => void;
};

export function HarvestInventoryDialog({ open, parts, onConfirm, onSkip }: HarvestInventoryDialogProps) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState<Set<string>>(new Set(parts));

  useEffect(() => {
    if (open) setChecked(new Set(parts));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggle(part: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(part)) next.delete(part);
      else next.add(part);
      return next;
    });
  }

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('harvestDialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('harvestDialogDesc')}
          </DialogDescription>
        </DialogHeader>

        <ul className='space-y-2 py-1'>
          {parts.map((part) => (
            <li key={part}>
              <label className='flex items-center gap-2.5 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={checked.has(part)}
                  onChange={() => toggle(part)}
                  className='size-4 rounded border-input bg-transparent accent-amber-500 cursor-pointer'
                />
                <span className='font-mono text-sm text-foreground'>{part}</span>
              </label>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant='outline' onClick={onSkip}>
            {t('harvestSkip')}
          </Button>
          <Button onClick={() => onConfirm([...checked])} disabled={checked.size === 0}>
            {t('harvestAddSelected')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
