import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns/format';
import { useGetWatchById } from '#/hooks/watches';
import { useUser } from '#/hooks/user';
import {
  useGetTimegrapherReadings,
  useCreateTimegrapherReading,
  useDeleteTimegrapherReading,
  useAnalyzeTimegrapherReading,
} from '#/hooks/timegrapher';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog';
import { useSubscription } from '#/hooks/subscription';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { KpiCard } from '#/components/primitives/KpiCard';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { cn } from '#/lib/helpers';
import type { TimegrapherReading, TimegrapherStatus } from '#/types';
import { Field, FieldError, FieldLabel } from '#/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { Input } from '#/components/ui/input';
import { useFeatureFlagEnabled } from '@posthog/react';
import { FeatureFlags } from '#/lib/constants';
import { Checkbox } from '#/components/ui/checkbox';
import { Label } from '#/components/ui/label';

export const Route = createFileRoute('/watches/$watchId/timegrapher')({
  component: TimegrapherPage,
});

const STATUS_LABELS: Record<TimegrapherStatus, string> = {
  post_service: 'Post-Service',
  pre_service: 'Pre-Service',
  incoming: 'Incoming',
  routine: 'Routine',
};

const POSITIONS = [
  { key: 'du', label: 'Dial Up' },
  { key: 'dd', label: 'Dial Down' },
  { key: 'cu', label: 'Crown Up' },
  { key: 'cd', label: 'Crown Down' },
  { key: 'cl', label: 'Crown Left' },
  { key: 'cr', label: 'Crown Right' },
] as const;

const BANNER_DISMISSED_KEY = 'timegrapher_chart_preview_dismissed';

const SAMPLE_RATES = [1.2, 3.5, -2.1, 4.8, 0.8, -1.5] as const;

function rateClass(rate: number | undefined): string {
  if (rate === undefined || rate === null) return 'text-muted-foreground';
  const abs = Math.abs(rate);
  if (abs <= 3) return 'text-green-400';
  if (abs <= 6) return 'text-amber-400';
  return 'text-red-400';
}

function getMeanRate(reading: TimegrapherReading): number | null {
  const rates: number[] = [];
  for (const pos of POSITIONS) {
    if (reading[`${pos.key}_snowstorm` as keyof TimegrapherReading]) continue;
    const r = reading[`${pos.key}_rate` as keyof TimegrapherReading] as
      | number
      | undefined;
    if (r !== undefined && r !== null) rates.push(r);
  }
  if (rates.length === 0) return null;
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}

function getAvgAmp(reading: TimegrapherReading): number | null {
  const amps: number[] = [];
  for (const pos of POSITIONS) {
    if (reading[`${pos.key}_snowstorm` as keyof TimegrapherReading]) continue;
    const a = reading[`${pos.key}_amp` as keyof TimegrapherReading] as
      | number
      | undefined;
    if (a !== undefined && a !== null) amps.push(a);
  }
  if (amps.length === 0) return null;
  return amps.reduce((a, b) => a + b, 0) / amps.length;
}

function getAvgBe(reading: TimegrapherReading): number | null {
  const bes: number[] = [];
  for (const pos of POSITIONS) {
    if (reading[`${pos.key}_snowstorm` as keyof TimegrapherReading]) continue;
    const b = reading[`${pos.key}_be` as keyof TimegrapherReading] as
      | number
      | undefined;
    if (b !== undefined && b !== null) bes.push(b);
  }
  if (bes.length === 0) return null;
  return bes.reduce((a, b) => a + b, 0) / bes.length;
}

function fmtRate(r: number | null | undefined): string {
  if (r === undefined || r === null) return '—';
  return (r >= 0 ? '+' : '') + r.toFixed(1);
}

function fmtNum(n: number | null | undefined, decimals = 0): string {
  if (n === undefined || n === null) return '—';
  return n.toFixed(decimals);
}

// ── Position bar chart ──────────────────────────────────────────────────────

function PositionChart({ reading }: { reading: TimegrapherReading }) {
  const allRates = POSITIONS.map((p) => {
    if (reading[`${p.key}_snowstorm` as keyof TimegrapherReading]) return null;
    return (
      (reading[`${p.key}_rate` as keyof TimegrapherReading] as
        | number
        | undefined) ?? null
    );
  });

  const definedRates = allRates.filter((r): r is number => r !== null);
  const maxAbs = definedRates.length
    ? Math.max(...definedRates.map(Math.abs), 4)
    : 10;

  return (
    <div className='rounded-xl border border-border bg-card p-5 mb-5'>
      <div className='flex items-center justify-between mb-4'>
        <span className='font-serif font-semibold text-sm text-foreground'>
          Rate by Position
        </span>
        <div className='flex items-center gap-4'>
          <span className='flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground'>
            <span className='w-2 h-2 rounded-full bg-green-400 inline-block' />
            Within spec (≤±3)
          </span>
          <span className='flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground'>
            <span className='w-2 h-2 rounded-full bg-amber-400 inline-block' />
            Marginal (±3–6)
          </span>
          <span className='flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground'>
            <span className='w-2 h-2 rounded-full bg-red-400 inline-block' />
            Out of spec (&gt;±6)
          </span>
        </div>
      </div>
      <div className='grid grid-cols-6 gap-3'>
        {POSITIONS.map((pos, i) => {
          const rate = allRates[i];
          const pct = rate !== null ? (Math.abs(rate) / maxAbs) * 45 : 0;
          const isPositive = rate !== null && rate >= 0;
          const colorClass =
            rate === null
              ? 'bg-muted'
              : Math.abs(rate) <= 3
                ? 'bg-green-400/60'
                : Math.abs(rate) <= 6
                  ? 'bg-amber-400/60'
                  : 'bg-red-400/60';

          return (
            <div key={pos.key} className='flex flex-col items-center gap-2'>
              <span className='font-mono text-[8.5px] text-muted-foreground uppercase tracking-wide'>
                {pos.label}
              </span>
              {/* Bar area — zero line at center */}
              <div className='relative w-full h-22 flex flex-col'>
                {/* Top half: positive rates grow downward toward zero */}
                <div className='flex-1 flex items-end'>
                  {isPositive && rate !== null && (
                    <div
                      className={cn('w-full rounded-t', colorClass)}
                      style={{ height: `${pct}%` }}
                    />
                  )}
                </div>
                {/* Zero line */}
                <div className='w-full h-px bg-border' />
                {/* Bottom half: negative rates grow downward */}
                <div className='flex-1 flex items-start'>
                  {!isPositive && rate !== null && (
                    <div
                      className={cn('w-full rounded-b', colorClass)}
                      style={{ height: `${pct}%` }}
                    />
                  )}
                </div>
              </div>
              <span
                className={cn(
                  'font-mono text-[11px] font-medium',
                  rateClass(rate ?? undefined),
                )}
              >
                {fmtRate(rate)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Premium chart preview banner ─────────────────────────────────────────────

function PremiumChartBanner({ onDismiss }: { onDismiss: () => void }) {
  const maxAbs = Math.max(...SAMPLE_RATES.map(Math.abs), 4);

  return (
    <div className='relative rounded-xl border border-amber-500/30 bg-card overflow-hidden'>
      <button
        type='button'
        onClick={onDismiss}
        aria-label='Dismiss banner'
        className='absolute top-3 right-3 z-20 w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors bg-transparent border-none cursor-pointer text-base leading-none'
      >
        ×
      </button>

      <div className='p-5'>
        <div className='mb-4'>
          <span className='font-mono text-[9px] uppercase tracking-widest text-amber-400'>
            Pro Feature
          </span>
          <h3 className='mt-1 font-serif text-sm font-semibold text-foreground'>
            6-Position Rate Tracking
          </h3>
          <p className='mt-0.5 font-mono text-[11px] text-muted-foreground max-w-lg'>
            Track rate, amplitude, and beat error in every orientation — dial
            up, dial down, crown up, crown down, crown left, and crown right.
          </p>
        </div>

        <div className='relative rounded-lg border border-border bg-muted/10 p-4 select-none'>
          <div className='grid grid-cols-6 gap-3'>
            {POSITIONS.map((pos, i) => {
              const rate = SAMPLE_RATES[i] ?? 0;
              const pct = (Math.abs(rate) / maxAbs) * 45;
              const isPositive = rate >= 0;
              const colorClass =
                Math.abs(rate) <= 3
                  ? 'bg-green-400/60'
                  : Math.abs(rate) <= 6
                    ? 'bg-amber-400/60'
                    : 'bg-red-400/60';
              return (
                <div key={pos.key} className='flex flex-col items-center gap-2'>
                  <span className='font-mono text-[8.5px] text-muted-foreground uppercase tracking-wide'>
                    {pos.label}
                  </span>
                  <div className='relative w-full h-16 flex flex-col'>
                    <div className='flex-1 flex items-end'>
                      {isPositive && (
                        <div
                          className={cn('w-full rounded-t', colorClass)}
                          style={{ height: `${pct}%` }}
                        />
                      )}
                    </div>
                    <div className='w-full h-px bg-border' />
                    <div className='flex-1 flex items-start'>
                      {!isPositive && (
                        <div
                          className={cn('w-full rounded-b', colorClass)}
                          style={{ height: `${pct}%` }}
                        />
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'font-mono text-[10px] font-medium',
                      rateClass(rate),
                    )}
                  >
                    {fmtRate(rate)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className='absolute inset-0 rounded-lg backdrop-blur-[2px] bg-card/65 flex flex-col items-center justify-center gap-2'>
            <span className='font-serif text-sm font-semibold text-foreground'>
              Rate by Position
            </span>
            <span className='font-mono text-[10px] text-muted-foreground'>
              Available with Pro
            </span>
            <Link
              to='/pro'
              className='mt-1 font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors'
            >
              View Pro →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Free-tier simple form ────────────────────────────────────────────────────

const freeSchema = z.object({
  status: z.enum(['post_service', 'pre_service', 'incoming', 'routine']),
  lift_angle: z.string().min(1, 'Required'),
  avg_rate: z.string().optional(),
  avg_amp: z.string().optional(),
  avg_be: z.string().optional(),
});

type FreeFormData = z.infer<typeof freeSchema>;

function FreeAddSessionForm({
  watchId,
  defaultLiftAngle,
  onSuccess,
  onCancel,
}: {
  watchId: string;
  defaultLiftAngle: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const createReading = useCreateTimegrapherReading(watchId);
  const { control, handleSubmit } = useForm<FreeFormData>({
    resolver: zodResolver(freeSchema),
    defaultValues: {
      status: 'routine',
      lift_angle: String(defaultLiftAngle),
    },
  });

  const inputCls =
    'w-full rounded border border-input bg-background px-2.5 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';

  const onSubmit = async (data: FreeFormData) => {
    await createReading.mutateAsync({
      watch: watchId,
      status: data.status,
      lift_angle: parseFloat(data.lift_angle),
      du_rate: parseOptNum(data.avg_rate),
      du_amp: parseOptNum(data.avg_amp),
      du_be: parseOptNum(data.avg_be),
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        <div className='space-y-1'>
          <Controller
            name='status'
            control={control}
            render={({ fieldState, field }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='free-status'>Session Type</FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id='free-status' className={inputCls}>
                    <SelectValue placeholder='Session type' />
                  </SelectTrigger>
                  <SelectContent position='popper'>
                    <SelectItem value='routine'>Routine</SelectItem>
                    <SelectItem value='pre_service'>Pre-Service</SelectItem>
                    <SelectItem value='post_service'>Post-Service</SelectItem>
                    <SelectItem value='incoming'>Incoming</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div className='space-y-1'>
          <Controller
            name='lift_angle'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='free-lift'>Lift Angle (°)</FieldLabel>
                <Input
                  {...field}
                  type='number'
                  step='1'
                  id='free-lift'
                  className={inputCls}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        <div className='space-y-1'>
          <Controller
            name='avg_rate'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='free-rate'>Average Rate (s/d)</FieldLabel>
                <Input
                  {...field}
                  type='number'
                  step='0.1'
                  id='free-rate'
                  placeholder='e.g. +2.1'
                  className={inputCls}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div className='space-y-1'>
          <Controller
            name='avg_amp'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='free-amp'>
                  Average Amplitude (°)
                </FieldLabel>
                <Input
                  {...field}
                  type='number'
                  step='1'
                  id='free-amp'
                  placeholder='e.g. 298'
                  className={inputCls}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div className='space-y-1'>
          <Controller
            name='avg_be'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='free-be'>Beat Error (ms)</FieldLabel>
                <Input
                  {...field}
                  type='number'
                  step='0.1'
                  id='free-be'
                  placeholder='e.g. 0.3'
                  className={inputCls}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </div>

      <div className='flex gap-3'>
        <button
          type='submit'
          disabled={createReading.isPending}
          className='inline-flex items-center rounded-md bg-primary px-4 py-2 text-xs font-mono text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity'
        >
          {createReading.isPending ? 'Saving…' : 'Save Session'}
        </button>
        <button
          type='button'
          onClick={onCancel}
          className='inline-flex items-center rounded-md border border-border px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors bg-transparent cursor-pointer'
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Pro full-positional form ──────────────────────────────────────────────────

const schema = z.object({
  status: z.enum(['post_service', 'pre_service', 'incoming', 'routine']),
  // All numeric fields kept as strings in the form and parsed on submit
  lift_angle: z.string().min(1, 'Required'),
  notes: z.string().max(800).optional(),
  du_snowstorm: z.boolean().optional(),
  dd_snowstorm: z.boolean().optional(),
  cu_snowstorm: z.boolean().optional(),
  cd_snowstorm: z.boolean().optional(),
  cl_snowstorm: z.boolean().optional(),
  cr_snowstorm: z.boolean().optional(),
  du_rate: z.string().optional(),
  du_amp: z.string().optional(),
  du_be: z.string().optional(),
  dd_rate: z.string().optional(),
  dd_amp: z.string().optional(),
  dd_be: z.string().optional(),
  cu_rate: z.string().optional(),
  cu_amp: z.string().optional(),
  cu_be: z.string().optional(),
  cd_rate: z.string().optional(),
  cd_amp: z.string().optional(),
  cd_be: z.string().optional(),
  cl_rate: z.string().optional(),
  cl_amp: z.string().optional(),
  cl_be: z.string().optional(),
  cr_rate: z.string().optional(),
  cr_amp: z.string().optional(),
  cr_be: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function parseOptNum(v: string | undefined): number | undefined {
  if (!v || v.trim() === '') return undefined;
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
}

function AddSessionForm({
  watchId,
  defaultLiftAngle,
  onSuccess,
  onCancel,
}: {
  watchId: string;
  defaultLiftAngle: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const createReading = useCreateTimegrapherReading(watchId);
  const { control, register, handleSubmit, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'routine',
      lift_angle: String(defaultLiftAngle),
    },
  });

  const snowstorms = watch([
    'du_snowstorm',
    'dd_snowstorm',
    'cu_snowstorm',
    'cd_snowstorm',
    'cl_snowstorm',
    'cr_snowstorm',
  ]);

  const onSubmit = async (data: FormData) => {
    await createReading.mutateAsync({
      watch: watchId,
      status: data.status,
      lift_angle: parseFloat(data.lift_angle),
      notes: data.notes || undefined,
      du_snowstorm: data.du_snowstorm || false,
      dd_snowstorm: data.dd_snowstorm || false,
      cu_snowstorm: data.cu_snowstorm || false,
      cd_snowstorm: data.cd_snowstorm || false,
      cl_snowstorm: data.cl_snowstorm || false,
      cr_snowstorm: data.cr_snowstorm || false,
      du_rate: parseOptNum(data.du_rate),
      du_amp: parseOptNum(data.du_amp),
      du_be: parseOptNum(data.du_be),
      dd_rate: parseOptNum(data.dd_rate),
      dd_amp: parseOptNum(data.dd_amp),
      dd_be: parseOptNum(data.dd_be),
      cu_rate: parseOptNum(data.cu_rate),
      cu_amp: parseOptNum(data.cu_amp),
      cu_be: parseOptNum(data.cu_be),
      cd_rate: parseOptNum(data.cd_rate),
      cd_amp: parseOptNum(data.cd_amp),
      cd_be: parseOptNum(data.cd_be),
      cl_rate: parseOptNum(data.cl_rate),
      cl_amp: parseOptNum(data.cl_amp),
      cl_be: parseOptNum(data.cl_be),
      cr_rate: parseOptNum(data.cr_rate),
      cr_amp: parseOptNum(data.cr_amp),
      cr_be: parseOptNum(data.cr_be),
    });
    onSuccess();
  };

  const inputCls =
    'w-full rounded border border-input bg-background px-2.5 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';

  return (
    <form
      id='new-timegrapher-form'
      onSubmit={handleSubmit(onSubmit)}
      className='space-y-4'
    >
      {/* Top row: status, lift angle, notes */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        <div className='space-y-1'>
          <Controller
            name='status'
            control={control}
            render={({ fieldState, field }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='status'>Session Type</FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id='status'
                    aria-invalid={fieldState.invalid}
                    className={inputCls}
                  >
                    <SelectValue placeholder='Session type' />
                  </SelectTrigger>
                  <SelectContent position='popper'>
                    <SelectItem value='routine'>Routine</SelectItem>
                    <SelectItem value='pre_service'>Pre-Service</SelectItem>
                    <SelectItem value='post_service'>Post-Service</SelectItem>
                    <SelectItem value='incoming'>Incoming</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div className='space-y-1'>
          <Controller
            name='lift_angle'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='lift_angle'>Lift Angle (º)</FieldLabel>
                <Input
                  {...field}
                  type='number'
                  step='1'
                  id='lift_angle'
                  aria-invalid={fieldState.invalid}
                  className={inputCls}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div className='space-y-1'>
          <Controller
            name='notes'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='notes'>Notes</FieldLabel>
                <Input
                  {...field}
                  id='notes'
                  type='text'
                  aria-invalid={fieldState.invalid}
                  placeholder='Optional...'
                  className={inputCls}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </div>

      {/* Position grid */}
      <div className='rounded border border-border overflow-hidden'>
        <table className='w-full'>
          <thead>
            <tr className='bg-muted/40 border-b border-border'>
              <th className='px-3 py-2 text-left font-mono text-[9px] uppercase tracking-widest text-muted-foreground'>
                Position
              </th>
              <th className='px-3 py-2 text-left font-mono text-[9px] uppercase tracking-widest text-muted-foreground'>
                Snowstorm?
              </th>
              <th className='px-3 py-2 text-left font-mono text-[9px] uppercase tracking-widest text-muted-foreground'>
                Rate (s/d)
              </th>
              <th className='px-3 py-2 text-left font-mono text-[9px] uppercase tracking-widest text-muted-foreground'>
                Amplitude (°)
              </th>
              <th className='px-3 py-2 text-left font-mono text-[9px] uppercase tracking-widest text-muted-foreground'>
                Beat Error (ms)
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border'>
            {POSITIONS.map((pos, i) => {
              const isSnowstorm = snowstorms[i] === true;
              return (
                <tr
                  key={pos.key}
                  className='hover:bg-muted/20 transition-colors'
                >
                  <td className='px-3 py-2 font-mono text-[11px] text-muted-foreground'>
                    {pos.label}
                  </td>
                  <td className='px-3 py-2 flex items-center gap-2'>
                    <Controller
                      name={`${pos.key}_snowstorm` as keyof FormData}
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id={`${pos.key}_snowstorm`}
                          checked={field.value === true}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              setValue(`${pos.key}_rate` as keyof FormData, '');
                              setValue(`${pos.key}_amp` as keyof FormData, '');
                              setValue(`${pos.key}_be` as keyof FormData, '');
                            }
                          }}
                        />
                      )}
                    />
                    <Label htmlFor={`${pos.key}_snowstorm`} className='sr-only'>
                      Snowstorm
                    </Label>
                  </td>
                  <td className='px-3 py-2'>
                    <Input
                      {...register(`${pos.key}_rate`)}
                      type='number'
                      step='0.1'
                      placeholder='e.g. +2.1'
                      className={cn(inputCls, 'w-full')}
                      disabled={isSnowstorm}
                    />
                  </td>
                  <td className='px-3 py-2'>
                    <Input
                      {...register(`${pos.key}_amp`)}
                      type='number'
                      step='1'
                      placeholder='e.g. 298'
                      className={cn(inputCls, 'w-full')}
                      disabled={isSnowstorm}
                    />
                  </td>
                  <td className='px-3 py-2'>
                    <Input
                      {...register(`${pos.key}_be`)}
                      type='number'
                      step='0.1'
                      placeholder='e.g. 0.3'
                      className={cn(inputCls, 'w-full')}
                      disabled={isSnowstorm}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className='flex gap-3'>
        <button
          type='submit'
          disabled={createReading.isPending}
          className='inline-flex items-center rounded-md bg-primary px-4 py-2 text-xs font-mono text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity'
        >
          {createReading.isPending ? 'Saving…' : 'Save Session'}
        </button>
        <button
          type='button'
          onClick={onCancel}
          className='inline-flex items-center rounded-md border border-border px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors bg-transparent cursor-pointer'
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

function TimegrapherPage() {
  const { watchId } = Route.useParams();
  const aiFeatureFlag = useFeatureFlagEnabled(
    FeatureFlags.TimegrapherAIAnalysis,
  );
  const showAiAnalysis =
    aiFeatureFlag || process.env.NODE_ENV === 'development';
  const { data: watch, isLoading: watchLoading } = useGetWatchById(watchId);
  const { data: readings = [], isLoading: readingsLoading } =
    useGetTimegrapherReadings(watchId);
  const { data: user } = useUser();
  const { isPro } = useSubscription();
  const deleteReading = useDeleteTimegrapherReading(watchId);
  const analyzeReading = useAnalyzeTimegrapherReading(watchId);

  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analysisReading, setAnalysisReading] = useState<
    (typeof readings)[number] | null
  >(null);
  const [showAiUpsell, setShowAiUpsell] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(
    () =>
      typeof window !== 'undefined' &&
      localStorage.getItem(BANNER_DISMISSED_KEY) === 'true',
  );

  if (watchLoading || readingsLoading) {
    return (
      <div className='text-sm font-mono text-muted-foreground'>Loading…</div>
    );
  }

  if (!watch) {
    return (
      <div className='space-y-3'>
        <Link
          to='/watches'
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          ← Back to Watches
        </Link>
        <div className='text-sm text-red-400 font-mono'>Watch not found.</div>
      </div>
    );
  }

  const latest = readings[0] ?? null;
  const chartReading =
    selectedId !== null
      ? (readings.find((r) => r.id === selectedId) ?? latest)
      : latest;

  const meanRate = latest ? getMeanRate(latest) : null;
  const avgAmp = latest ? getAvgAmp(latest) : null;
  const avgBe = latest ? getAvgBe(latest) : null;
  const defaultLiftAngle = latest?.lift_angle ?? 52;

  return (
    <div className='space-y-5 min-w-0'>
      {/* Back link */}
      <Link
        to='/watches/$watchId'
        params={{ watchId }}
        className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
      >
        ← Back to Watch
      </Link>

      {/* Header */}
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-serif font-semibold text-foreground'>
            {watch.make} {watch.model}
          </h1>
          <div className='mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground'>
            <span>{watch.reference}</span>
            {latest && (
              <>
                <span className='text-muted-foreground/40'>·</span>
                <span>Lift Angle {latest.lift_angle}°</span>
              </>
            )}
            <span className='text-muted-foreground/40'>·</span>
            <StatusBadge status={watch.status} />
          </div>
        </div>
        {user && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className='inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-mono text-primary-foreground hover:opacity-90 transition-opacity'
          >
            + Add Session
          </button>
        )}
      </div>

      {/* KPI strip */}
      {isPro ? (
        <div className='grid grid-cols-2 sm:grid-cols-5 gap-3'>
          <KpiCard
            highlight
            label='Latest DU Rate'
            value={fmtRate(latest?.du_rate)}
            valueClass={rateClass(latest?.du_rate)}
            sub='s/d dial up'
          />
          <KpiCard
            label='Avg Amplitude'
            value={avgAmp !== null ? `${fmtNum(avgAmp)}°` : '—'}
            sub='target ≥ 270°'
          />
          <KpiCard
            label='Avg Beat Error'
            value={avgBe !== null ? `${fmtNum(avgBe, 1)} ms` : '—'}
            sub='target ≤ 0.5'
          />
          <KpiCard
            label='Mean Rate'
            value={fmtRate(meanRate)}
            valueClass={rateClass(meanRate ?? undefined)}
            sub='avg all positions'
          />
          <KpiCard
            label='Sessions'
            value={readings.length}
            sub={`${readings.length} total`}
          />
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
          <KpiCard
            highlight
            label='Avg Rate'
            value={fmtRate(latest?.du_rate)}
            valueClass={rateClass(latest?.du_rate)}
            sub='s/d'
          />
          <KpiCard
            label='Avg Amplitude'
            value={
              latest?.du_amp !== undefined && latest?.du_amp !== null
                ? `${fmtNum(latest.du_amp)}°`
                : '—'
            }
            sub='target ≥ 270°'
          />
          <KpiCard
            label='Sessions'
            value={readings.length}
            sub={`${readings.length} total`}
          />
        </div>
      )}

      {/* Position chart — Pro only */}
      {isPro && chartReading && <PositionChart reading={chartReading} />}

      {/* Premium chart preview banner */}
      {!isPro && !bannerDismissed && (
        <PremiumChartBanner
          onDismiss={() => {
            localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
            setBannerDismissed(true);
          }}
        />
      )}

      {/* Pro upsell nudge for free users — only shown once preview banner is dismissed */}
      {!isPro && bannerDismissed && (
        <div className='flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-950/80 px-4 py-3'>
          <span className='font-mono text-[11px] text-amber-200'>
            Upgrade to Pro for 6-position logging (DU · DD · CU · CD · CL · CR)
            and delta tracking.
          </span>
          <Link
            to='/pro'
            className='shrink-0 font-mono text-[10px] tracking-widest uppercase px-3 py-1 rounded border border-amber-500/60 bg-amber-500/20 text-amber-200 hover:bg-amber-500/35 transition-colors'
          >
            View Pro
          </Link>
        </div>
      )}

      {/* Add session form */}
      {showForm && user && (
        <div className='rounded-xl border border-border bg-card p-5'>
          <SectionLabel>New Session</SectionLabel>
          <div className='mt-3'>
            {isPro ? (
              <AddSessionForm
                watchId={watchId}
                defaultLiftAngle={defaultLiftAngle}
                onSuccess={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            ) : (
              <FreeAddSessionForm
                watchId={watchId}
                defaultLiftAngle={defaultLiftAngle}
                onSuccess={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* Sessions table */}
      <div>
        <SectionLabel>
          {'Session History · '}
          {readings.length}
          {readings.length === 1 ? ' session' : ' sessions'}
        </SectionLabel>
        <div className='mt-3'>
          {readings.length === 0 ? (
            <div className='rounded-xl border border-border bg-card px-5 py-8 text-center font-mono text-xs text-muted-foreground'>
              No timegrapher sessions yet.{' '}
              {user && (
                <button
                  onClick={() => setShowForm(true)}
                  className='text-primary hover:text-primary/80 bg-transparent border-none cursor-pointer font-mono text-xs p-0'
                >
                  Log the first one →
                </button>
              )}
            </div>
          ) : isPro ? (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Lift °</Th>
                  <Th>DU</Th>
                  <Th>DD</Th>
                  <Th>CU</Th>
                  <Th>CD</Th>
                  <Th>CL</Th>
                  <Th>CR</Th>
                  <Th>Mean</Th>
                  <Th>Notes</Th>
                  {user && aiFeatureFlag && <Th>{''}</Th>}
                  {user && <Th>{''}</Th>}
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => {
                  const mean = getMeanRate(r);
                  const isSelected =
                    selectedId === r.id ||
                    (selectedId === null && r.id === latest?.id);
                  const rates = [
                    r.du_rate,
                    r.dd_rate,
                    r.cu_rate,
                    r.cd_rate,
                    r.cl_rate,
                    r.cr_rate,
                  ] as (number | undefined)[];
                  return (
                    <TableRow
                      key={r.id}
                      onClick={() =>
                        setSelectedId((cur) => (cur === r.id ? null : r.id))
                      }
                    >
                      <Td
                        className={cn(
                          'font-mono text-[11px]',
                          isSelected && 'text-primary',
                        )}
                      >
                        {format(new Date(r.created), 'MMM d, yyyy')}
                      </Td>
                      <Td className='font-mono text-[11px] text-muted-foreground'>
                        {STATUS_LABELS[r.status]}
                      </Td>
                      <Td className='font-mono text-[11px] text-muted-foreground'>
                        {r.lift_angle}°
                      </Td>
                      {rates.map((rate, i) => (
                        <Td
                          key={i}
                          className={cn(
                            'font-mono text-[11px] font-medium',
                            rateClass(rate),
                          )}
                        >
                          {fmtRate(rate)}
                        </Td>
                      ))}
                      <Td
                        className={cn(
                          'font-mono text-[11px] font-medium',
                          rateClass(mean ?? undefined),
                        )}
                      >
                        {fmtRate(mean)}
                      </Td>
                      <Td className='font-mono text-[11px] text-muted-foreground max-w-40 truncate'>
                        {r.notes ?? ''}
                      </Td>
                      {user && showAiAnalysis && (
                        <Td>
                          <div className='flex items-center gap-2'>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAnalysisReading(r);
                              }}
                              className='font-mono text-[9px] tracking-widest uppercase px-2 py-1 rounded bg-amber-500 text-zinc-950 font-semibold hover:bg-amber-400 transition-colors cursor-pointer'
                              aria-label='AI analysis'
                            >
                              AI
                            </button>
                          </div>
                        </Td>
                      )}
                      {user && (
                        <Td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this session?')) {
                                deleteReading.mutate(r.id);
                                if (selectedId === r.id) setSelectedId(null);
                              }
                            }}
                            className='text-muted-foreground hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer text-base leading-none p-0'
                            aria-label='Delete session'
                          >
                            ×
                          </button>
                        </Td>
                      )}
                    </TableRow>
                  );
                })}
              </tbody>
            </TableWrap>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Lift °</Th>
                  <Th>Avg Rate</Th>
                  <Th>Avg Amplitude</Th>
                  <Th>Beat Error</Th>
                  {user && aiFeatureFlag && <Th>{''}</Th>}
                  {user && <Th>{''}</Th>}
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <TableRow key={r.id}>
                    <Td className='font-mono text-[11px]'>
                      {format(new Date(r.created), 'MMM d, yyyy')}
                    </Td>
                    <Td className='font-mono text-[11px] text-muted-foreground'>
                      {STATUS_LABELS[r.status]}
                    </Td>
                    <Td className='font-mono text-[11px] text-muted-foreground'>
                      {r.lift_angle}°
                    </Td>
                    <Td
                      className={cn(
                        'font-mono text-[11px] font-medium',
                        rateClass(r.du_rate),
                      )}
                    >
                      {fmtRate(r.du_rate)}
                    </Td>
                    <Td className='font-mono text-[11px] text-muted-foreground'>
                      {r.du_amp !== undefined && r.du_amp !== null
                        ? `${fmtNum(r.du_amp)}°`
                        : '—'}
                    </Td>
                    <Td className='font-mono text-[11px] text-muted-foreground'>
                      {r.du_be !== undefined && r.du_be !== null
                        ? `${fmtNum(r.du_be, 1)} ms`
                        : '—'}
                    </Td>
                    {user && showAiAnalysis && (
                      <Td>
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAiUpsell(true);
                            }}
                            className='font-mono text-[9px] tracking-widest uppercase px-2 py-1 rounded bg-amber-500/15 text-amber-400/70 border border-amber-500/30 hover:bg-amber-500/25 hover:text-amber-400 transition-colors cursor-pointer'
                            aria-label='AI analysis (Pro)'
                          >
                            ✦ AI
                          </button>
                        </div>
                      </Td>
                    )}
                    {user && (
                      <Td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this session?')) {
                              deleteReading.mutate(r.id);
                            }
                          }}
                          className='text-muted-foreground hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer text-base leading-none p-0'
                          aria-label='Delete session'
                        >
                          ×
                        </button>
                      </Td>
                    )}
                  </TableRow>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>
      </div>

      {/* AI upsell dialog — free users */}
      <Dialog open={showAiUpsell} onOpenChange={setShowAiUpsell}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle className='font-serif text-base flex items-center gap-2'>
              <span className='text-amber-400'>✦</span> AI Timegrapher Analysis
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3 py-1'>
            <p className='font-mono text-[11px] leading-relaxed text-muted-foreground'>
              Pro members get an instant AI-generated interpretation of each
              session — explaining what the numbers mean, flagging issues, and
              suggesting next steps.
            </p>
            <ul className='space-y-1.5'>
              {[
                'Rate deviation diagnosis across all 6 positions',
                'Amplitude & beat error interpretation',
                'Service recommendations based on the data',
              ].map((item) => (
                <li
                  key={item}
                  className='flex items-start gap-2 font-mono text-[11px] text-foreground'
                >
                  <span className='mt-px text-amber-400 shrink-0'>✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter showCloseButton>
            <Link
              to='/pro'
              className='inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-[11px] font-mono text-zinc-950 font-semibold hover:bg-amber-400 transition-colors'
            >
              Upgrade to Pro →
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Analysis modal */}
      <Dialog
        open={analysisReading !== null}
        onOpenChange={(open) => {
          if (!open) setAnalysisReading(null);
        }}
      >
        <DialogContent className='sm:max-w-lg flex flex-col max-h-[80vh]'>
          <DialogHeader>
            <DialogTitle className='font-serif text-base'>
              AI Analysis
              {analysisReading && (
                <span className='ml-2 font-mono text-[10px] font-normal text-muted-foreground'>
                  {STATUS_LABELS[analysisReading.status]} ·{' '}
                  {format(new Date(analysisReading.created), 'MMM d, yyyy')}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {analysisReading && (
            <div className='overflow-y-auto flex-1 min-h-0'>
              {analysisReading.ai_analysis ? (
                <p className='font-mono text-[11px] leading-relaxed text-foreground whitespace-pre-wrap'>
                  {analysisReading.ai_analysis}
                </p>
              ) : (
                <p className='font-mono text-xs text-muted-foreground'>
                  No analysis yet. Generate one below.
                </p>
              )}
            </div>
          )}

          <DialogFooter showCloseButton>
            {analysisReading && !analysisReading.ai_analysis && (
              <button
                onClick={() => {
                  analyzeReading.mutate(analysisReading, {
                    onSuccess: (analysis) => {
                      setAnalysisReading((r) =>
                        r ? { ...r, ai_analysis: analysis } : r,
                      );
                    },
                  });
                }}
                disabled={analyzeReading.isPending}
                className='inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-[11px] font-mono text-zinc-950 font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {analyzeReading.isPending
                  ? 'Analyzing…'
                  : '✦ Generate Analysis'}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
