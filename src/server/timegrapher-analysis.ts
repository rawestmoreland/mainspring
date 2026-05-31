import { createServerFn } from '@tanstack/react-start';
import Anthropic from '@anthropic-ai/sdk';
import type { TimegrapherReading } from '#/types';

const POSITIONS = [
  { key: 'du', label: 'Dial Up' },
  { key: 'dd', label: 'Dial Down' },
  { key: 'cu', label: 'Crown Up' },
  { key: 'cd', label: 'Crown Down' },
  { key: 'cl', label: 'Crown Left' },
  { key: 'cr', label: 'Crown Right' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  post_service: 'Post-Service',
  pre_service: 'Pre-Service',
  incoming: 'Incoming',
  routine: 'Routine',
};

function buildReadingContext(reading: TimegrapherReading): string {
  const lines: string[] = [];
  lines.push(`Session type: ${STATUS_LABELS[reading.status] ?? reading.status}`);
  lines.push(`Lift angle: ${reading.lift_angle}°`);
  if (reading.notes) lines.push(`Notes: ${reading.notes}`);
  lines.push('');
  lines.push('Position data:');

  for (const pos of POSITIONS) {
    const rate = reading[`${pos.key}_rate` as keyof TimegrapherReading] as number | undefined;
    const amp = reading[`${pos.key}_amp` as keyof TimegrapherReading] as number | undefined;
    const be = reading[`${pos.key}_be` as keyof TimegrapherReading] as number | undefined;
    if (rate === undefined && amp === undefined && be === undefined) continue;
    const parts: string[] = [`  ${pos.label}:`];
    if (rate !== undefined) parts.push(`rate ${rate >= 0 ? '+' : ''}${rate.toFixed(1)} s/d`);
    if (amp !== undefined) parts.push(`amplitude ${amp}°`);
    if (be !== undefined) parts.push(`beat error ${be.toFixed(1)} ms`);
    lines.push(parts.join('  '));
  }

  return lines.join('\n');
}

export const analyzeTimegrapherReading = createServerFn({ method: 'POST' })
  .inputValidator((reading: TimegrapherReading) => reading)
  .handler(async ({ data: reading }) => {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const readingContext = buildReadingContext(reading);

    const prompt = `You are an expert watchmaker and horologist analyzing timegrapher data for a mechanical watch. Timegrapher readings measure a movement's accuracy and health using three key metrics per position: rate (seconds gained/lost per day), amplitude (balance wheel arc in degrees), and beat error (asymmetry between tick and tock in milliseconds).

Reference benchmarks:
- Rate: ±3 s/d or better is excellent; ±6 is acceptable; beyond ±10 needs adjustment
- Amplitude: ≥280° is healthy; 250–280° is marginal; <250° suggests lubrication issues or weak mainspring
- Beat error: ≤0.5 ms is ideal; 0.5–1.0 ms is acceptable; >1.0 ms needs adjustment
- Positional variance in rate (DU vs DD, crown positions): should be within ±15 s/d ideally

Here is the timegrapher session data:

${readingContext}

Please provide:
1. A brief overall assessment (2–3 sentences) on the movement's condition
2. Any specific issues detected, with likely causes
3. Actionable troubleshooting steps or recommendations, ordered by priority

Keep the response concise and technical but readable. Use plain text, no markdown formatting.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    return { analysis: text };
  });
