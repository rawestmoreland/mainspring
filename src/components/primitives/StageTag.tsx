import { cn } from '#/lib/helpers';
import { STAGE_META } from '#/lib/mocks/meta';

export function StageTag({ stage }: { stage: string }) {
  const m = STAGE_META[stage];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] border backdrop-blur-sm',
        m.className,
      )}
    >
      {m.label}
    </span>
  );
}
