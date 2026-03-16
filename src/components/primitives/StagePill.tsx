import { cn } from '#/lib/helpers';
import { STAGE_META } from '#/lib/mocks/meta';

export function StagePill({
  stage,
  active,
  onClick,
}: {
  stage: string;
  active: boolean;
  onClick: () => void;
}) {
  const m = STAGE_META[stage];
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-full font-mono text-[10px] border tracking-wide transition-opacity hover:opacity-80',
        active ? m.className : 'bg-transparent text-zinc-500 border-zinc-700',
      )}
    >
      {m.label}
    </button>
  );
}
