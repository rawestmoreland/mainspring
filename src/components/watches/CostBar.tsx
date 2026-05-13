import type { Watch } from '#/types';
import { profit } from '#/lib/helpers';

type Props = {
  watch: Watch;
  width?: number;
  height?: number;
};

// Stacked bar: amber=paid, zinc=parts, green=profit, red=loss.
// Scale: total = max(bought+parts, sold_price) so the bar always
// fills to the largest value in the picture.
export function CostBar({ watch, width = 80, height = 10 }: Props) {
  const p = profit(watch);
  const base = watch.bought_price + watch.parts_cost;
  const total = Math.max(base, watch.sold_price ?? 0);

  if (total === 0) return null;

  const s = width / total;
  const paidW = Math.round(watch.bought_price * s);
  const partsW = Math.round(watch.parts_cost * s);
  const baseW = paidW + partsW;

  const barY = 2;
  const barH = height - 4;
  const accentY = barY - 1;
  const accentH = barH + 2;

  const soldX = watch.sold_price !== null ? Math.round(watch.sold_price * s) : 0;

  const tipLines = [
    `Paid: $${watch.bought_price.toLocaleString()}`,
    `Parts: $${watch.parts_cost.toLocaleString()}`,
    watch.sold_price !== null
      ? `Sold: $${watch.sold_price.toLocaleString()}`
      : null,
    p !== null
      ? `${p >= 0 ? 'Profit' : 'Loss'}: $${Math.abs(p).toLocaleString()}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <svg
      width={width}
      height={height}
      className="block"
      aria-label={tipLines}
    >
      <title>{tipLines}</title>

      {/* track */}
      <rect x={0} y={barY} width={width} height={barH} rx={1} fill="rgb(39 39 42 / 0.7)" />

      {/* paid — amber-600 */}
      {paidW > 0 && (
        <rect x={0} y={barY} width={paidW} height={barH} fill="#d97706" />
      )}

      {/* parts — zinc-500 */}
      {partsW > 0 && (
        <rect x={paidW} y={barY} width={partsW} height={barH} fill="#71717a" />
      )}

      {/* profit — green-400, extends right of base */}
      {p !== null && p > 0 && width - baseW > 0 && (
        <rect
          x={baseW}
          y={accentY}
          width={width - baseW}
          height={accentH}
          rx={1}
          fill="#4ade80"
        />
      )}

      {/* loss — red-400, overlays unrecovered portion of base */}
      {p !== null && p < 0 && baseW - soldX > 0 && (
        <rect
          x={soldX}
          y={accentY}
          width={baseW - soldX}
          height={accentH}
          rx={1}
          fill="#f87171"
          fillOpacity={0.9}
        />
      )}
    </svg>
  );
}
