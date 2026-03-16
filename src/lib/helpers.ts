import type { Watch } from '#/types';

export function placeholderImg(seed: string) {
  return `https://picsum.photos/seed/${seed}/800/600`;
}

export function profit(w: Watch): number | null {
  if (w.status !== 'sold' || !w.sold_price) return null;
  return w.sold_price - w.bought_price - w.parts_cost;
}

export function roi(w: Watch): string | null {
  const p = profit(w);
  if (p === null) return null;
  return ((p / (w.bought_price + w.parts_cost)) * 100).toFixed(1);
}

export function fmt(n: number | null | undefined, d = 0): string {
  if (n === null || n === undefined) return '—';
  return (
    '$' +
    Number(n).toLocaleString('en-US', {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    })
  );
}

export function fmtPct(n: string | number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return (num > 0 ? '+' : '') + n + '%';
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
