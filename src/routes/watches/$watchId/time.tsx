import { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { format } from 'date-fns/format';
import {
  LockIcon,
  PlayIcon,
  PauseIcon,
  StopCircleIcon,
  PencilIcon,
  Trash2Icon,
  PlusIcon,
} from 'lucide-react';
import { useGetWatchById } from '#/hooks/watches';
import { useUser } from '#/hooks/user';
import { useSubscription } from '#/hooks/subscription';
import {
  useActiveWorkSession,
  useCompletedWorkSessions,
  useCreateWorkSession,
  useCreateManualWorkSession,
  usePauseWorkSession,
  useResumeWorkSession,
  useStopWorkSession,
  useUpdateWorkSession,
  useDeleteWorkSession,
} from '#/hooks/workSessions';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { KpiCard } from '#/components/primitives/KpiCard';
import { UpgradeButton } from '#/components/primitives/UpgradeButton';
import { cn } from '#/lib/helpers';
import type { WorkSession } from '#/types';

export const Route = createFileRoute('/watches/$watchId/time')({
  component: TimePage,
});

function formatClock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

function fmtDuration(seconds: number, t: TFunction): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}${t('unitH')} ${m}${t('unitM')}`;
  if (h > 0) return `${h}${t('unitH')}`;
  if (m > 0) return `${m}${t('unitM')}`;
  return `${seconds}${t('unitS')}`;
}

function fmtTime(iso: string): string {
  return format(new Date(iso), 'h:mm a');
}

function groupByDate(sessions: WorkSession[]): [string, WorkSession[]][] {
  const map = new Map<string, WorkSession[]>();
  for (const s of sessions) {
    const key = format(new Date(s.ended_at!), 'MMM d, yyyy');
    const existing = map.get(key);
    if (existing) {
      existing.push(s);
    } else {
      map.set(key, [s]);
    }
  }
  return Array.from(map.entries());
}

function computeManualDuration(
  startedAt: string,
  endedAt: string,
): number | null {
  if (!startedAt || !endedAt) return null;
  const diff = Math.floor(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );
  return diff > 0 ? diff : null;
}

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function computeElapsed(session: WorkSession): number {
  if (session.status === 'paused') return session.total_elapsed_seconds;
  const segStart = new Date(session.started_at).getTime();
  return (
    session.total_elapsed_seconds + Math.floor((Date.now() - segStart) / 1000)
  );
}

function TimePage() {
  const { t } = useTranslation();
  const { watchId } = Route.useParams();
  const { data: watch, isLoading: watchLoading } = useGetWatchById(watchId);
  const { data: user } = useUser();
  const { isPro } = useSubscription();
  const { data: activeSession, isLoading: sessionLoading } =
    useActiveWorkSession(watchId);
  const { data: completedSessions = [] } = useCompletedWorkSessions(watchId);

  const createSession = useCreateWorkSession(watchId);
  const createManualSession = useCreateManualWorkSession(watchId);
  const pauseSession = usePauseWorkSession(watchId);
  const resumeSession = useResumeWorkSession(watchId);
  const stopSession = useStopWorkSession(watchId);
  const updateSession = useUpdateWorkSession(watchId);
  const deleteSession = useDeleteWorkSession(watchId);

  const [elapsed, setElapsed] = useState(0);
  const [label, setLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    label: '',
    startedAt: '',
    endedAt: '',
  });
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDraft, setManualDraft] = useState({
    startedAt: '',
    endedAt: '',
    label: '',
  });

  function startEdit(s: WorkSession) {
    setEditDraft({
      label: s.label ?? '',
      startedAt: toDateTimeLocal(s.started_at),
      endedAt: s.ended_at ? toDateTimeLocal(s.ended_at) : '',
    });
    setEditingId(s.id);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(id: string) {
    const dur = computeManualDuration(editDraft.startedAt, editDraft.endedAt);
    if (!dur) return;
    updateSession.mutate(
      {
        id,
        label: editDraft.label,
        startedAt: new Date(editDraft.startedAt),
        endedAt: new Date(editDraft.endedAt),
      },
      { onSuccess: () => setEditingId(null) },
    );
  }

  function confirmDelete(id: string) {
    if (window.confirm(t('timeDeleteConfirm'))) {
      deleteSession.mutate(id, { onSuccess: () => setEditingId(null) });
    }
  }

  function submitManualSession() {
    const dur = computeManualDuration(
      manualDraft.startedAt,
      manualDraft.endedAt,
    );
    if (!dur) return;
    createManualSession.mutate(
      {
        startedAt: new Date(manualDraft.startedAt),
        endedAt: new Date(manualDraft.endedAt),
        label: manualDraft.label || undefined,
      },
      {
        onSuccess: () => {
          setShowManualForm(false);
          setManualDraft({ startedAt: '', endedAt: '', label: '' });
        },
      },
    );
  }

  function resetManualForm() {
    setShowManualForm(false);
    setManualDraft({ startedAt: '', endedAt: '', label: '' });
  }

  useEffect(() => {
    if (!activeSession) {
      setElapsed(0);
      return;
    }
    setElapsed(computeElapsed(activeSession));

    if (activeSession.status !== 'running') return;

    const id = setInterval(() => {
      setElapsed(computeElapsed(activeSession));
    }, 1000);
    return () => clearInterval(id);
  }, [
    activeSession?.id,
    activeSession?.status,
    activeSession?.started_at,
    activeSession?.total_elapsed_seconds,
  ]);

  const totalSeconds = completedSessions.reduce(
    (sum, s) => sum + (s.final_duration_seconds ?? 0),
    0,
  );
  const totalWithActive =
    totalSeconds + (activeSession?.status !== 'completed' ? elapsed : 0);

  const grouped = groupByDate(completedSessions);
  const isRunning = activeSession?.status === 'running';
  const isPaused = activeSession?.status === 'paused';

  if (watchLoading || sessionLoading) {
    return (
      <div className='text-sm font-mono text-muted-foreground'>{t('equipmentLoading')}</div>
    );
  }

  if (!watch) {
    return (
      <div className='space-y-3'>
        <Link
          to='/watches'
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          {t('watchesBackToWatches')}
        </Link>
        <div className='text-sm text-red-400 font-mono'>{t('equipmentItemNotFound')}</div>
      </div>
    );
  }

  return (
    <div className='space-y-5 min-w-0'>
      <Link
        to='/watches/$watchId'
        params={{ watchId }}
        className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
      >
        {t('timeBackToWatch')}
      </Link>

      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-serif font-semibold text-foreground'>
            {watch.make} {watch.model}
          </h1>
          <div className='mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground'>
            {watch.reference && <span>{watch.reference}</span>}
            <span className='text-muted-foreground/40'>·</span>
            <StatusBadge status={watch.status} />
          </div>
        </div>
      </div>

      {!isPro ? (
        <div className='flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-14 mt-2'>
          <LockIcon className='w-5 h-5 text-amber-400' />
          <p className='font-mono text-xs text-muted-foreground text-center max-w-xs'>
            {t('timeProGate')}
          </p>
          {user && <UpgradeButton pbUserId={user.id} />}
        </div>
      ) : (
        <>
          {/* Total time KPI */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            <KpiCard
              highlight
              label={t('timeTotalTime')}
              value={totalWithActive > 0 ? fmtDuration(totalWithActive, t) : '—'}
              sub={t('timeSessionsLogged', { count: completedSessions.length })}
            />
          </div>

          {/* Timer panel */}
          <div className='rounded-xl border border-border bg-card overflow-hidden'>
            <div className='px-5 py-3 border-b border-border'>
              <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                {t('timeCurrentSession')}
              </span>
            </div>

            <div className='flex flex-col items-center gap-6 px-5 py-10'>
              {/* Status dot + clock */}
              <div className='flex items-center gap-3'>
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full shrink-0',
                    isRunning
                      ? 'bg-green-400 animate-pulse'
                      : isPaused
                        ? 'bg-amber-400'
                        : 'bg-muted-foreground/30',
                  )}
                />
                <span className='font-mono text-6xl font-semibold tracking-tight text-foreground tabular-nums'>
                  {formatClock(elapsed)}
                </span>
              </div>

              {/* Label input — only when idle */}
              {!activeSession && (
                <input
                  type='text'
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={t('timePlaceholderLabel')}
                  className='w-full max-w-sm bg-transparent border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring'
                />
              )}
              {activeSession?.label && (
                <span className='font-mono text-[11px] text-muted-foreground italic'>
                  {activeSession.label}
                </span>
              )}

              {/* Controls */}
              <div className='flex items-center gap-3'>
                {!activeSession && (
                  <button
                    onClick={() => createSession.mutate(label || undefined)}
                    disabled={createSession.isPending}
                    className='inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-mono font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <PlayIcon className='w-4 h-4' />
                    {t('timeStartSession')}
                  </button>
                )}

                {isRunning && (
                  <>
                    <button
                      onClick={() =>
                        pauseSession.mutate({
                          id: activeSession.id,
                          totalElapsed: elapsed,
                        })
                      }
                      disabled={pauseSession.isPending}
                      className='inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-5 py-2.5 text-sm font-mono text-foreground hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <PauseIcon className='w-4 h-4' />
                      {t('timePause')}
                    </button>
                    <button
                      onClick={() =>
                        stopSession.mutate({
                          id: activeSession.id,
                          finalDuration: elapsed,
                        })
                      }
                      disabled={stopSession.isPending}
                      className='inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-5 py-2.5 text-sm font-mono text-foreground hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <StopCircleIcon className='w-4 h-4' />
                      {t('timeStop')}
                    </button>
                  </>
                )}

                {isPaused && (
                  <>
                    <button
                      onClick={() => resumeSession.mutate(activeSession.id)}
                      disabled={resumeSession.isPending}
                      className='inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-mono font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <PlayIcon className='w-4 h-4' />
                      {t('timeResume')}
                    </button>
                    <button
                      onClick={() =>
                        stopSession.mutate({
                          id: activeSession.id,
                          finalDuration: elapsed,
                        })
                      }
                      disabled={stopSession.isPending}
                      className='inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-5 py-2.5 text-sm font-mono text-foreground hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <StopCircleIcon className='w-4 h-4' />
                      {t('timeStopAndSave')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Manual session entry */}
          <div className='rounded-xl border border-border bg-card overflow-hidden'>
            <button
              onClick={() => setShowManualForm((v) => !v)}
              className='w-full flex items-center justify-between px-5 py-3 hover:bg-white/2 transition-colors'
            >
              <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                {t('timeLogManual')}
              </span>
              <PlusIcon
                className={cn(
                  'w-3.5 h-3.5 text-muted-foreground transition-transform duration-150',
                  showManualForm && 'rotate-45',
                )}
              />
            </button>

            {showManualForm && (
              <div className='border-t border-border px-5 py-4 space-y-3'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <label className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                      {t('timeStart')}
                    </label>
                    <input
                      type='datetime-local'
                      value={manualDraft.startedAt}
                      onChange={(e) =>
                        setManualDraft((d) => ({
                          ...d,
                          startedAt: e.target.value,
                        }))
                      }
                      className='w-full bg-transparent border border-border rounded-md px-3 py-2 text-[11px] font-mono text-foreground focus:outline-none focus:border-ring'
                    />
                  </div>
                  <div className='space-y-1'>
                    <label className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                      {t('timeEnd')}
                    </label>
                    <input
                      type='datetime-local'
                      value={manualDraft.endedAt}
                      onChange={(e) =>
                        setManualDraft((d) => ({
                          ...d,
                          endedAt: e.target.value,
                        }))
                      }
                      className='w-full bg-transparent border border-border rounded-md px-3 py-2 text-[11px] font-mono text-foreground focus:outline-none focus:border-ring'
                    />
                  </div>
                </div>

                <input
                  type='text'
                  value={manualDraft.label}
                  onChange={(e) =>
                    setManualDraft((d) => ({ ...d, label: e.target.value }))
                  }
                  placeholder={t('timePlaceholderLabelOpt')}
                  className='w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring'
                />

                {(() => {
                  const dur = computeManualDuration(
                    manualDraft.startedAt,
                    manualDraft.endedAt,
                  );
                  if (dur !== null) {
                    return (
                      <div className='flex items-center gap-2'>
                        <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                          {t('timeDuration')}
                        </span>
                        <span className='font-mono text-sm text-amber-400'>
                          {fmtDuration(dur, t)}
                        </span>
                      </div>
                    );
                  }
                  if (manualDraft.startedAt && manualDraft.endedAt) {
                    return (
                      <p className='font-mono text-[10px] text-red-400'>
                        {t('timeEndAfterStart')}
                      </p>
                    );
                  }
                  return null;
                })()}

                <div className='flex items-center justify-end gap-3 pt-1'>
                  <button
                    onClick={resetManualForm}
                    className='font-mono text-[10px] text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer'
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={submitManualSession}
                    disabled={
                      createManualSession.isPending ||
                      computeManualDuration(
                        manualDraft.startedAt,
                        manualDraft.endedAt,
                      ) === null
                    }
                    className='inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-mono font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {t('timeSaveSession')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Session history */}
          <div className='rounded-xl border border-border bg-card overflow-hidden'>
            <div className='px-5 py-3 border-b border-border'>
              <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                {t('timeSessionHistory')}
              </span>
            </div>

            {completedSessions.length === 0 ? (
              <div className='py-10 text-center font-mono text-xs text-muted-foreground'>
                {t('timeNoSessions')}
              </div>
            ) : (
              <div className='divide-y divide-border'>
                {grouped.map(([date, sessions]) => (
                  <div key={date}>
                    <div className='px-5 py-2 bg-white/2'>
                      <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60'>
                        {date}
                      </span>
                    </div>
                    <ul className='divide-y divide-border'>
                      {sessions.map((s) =>
                        editingId === s.id ? (
                          <li key={s.id} className='px-5 py-3 space-y-3'>
                            <input
                              type='text'
                              value={editDraft.label}
                              onChange={(e) =>
                                setEditDraft((d) => ({
                                  ...d,
                                  label: e.target.value,
                                }))
                              }
                              placeholder={t('timePlaceholderSessionLabel')}
                              className='w-full bg-transparent border border-border rounded-md px-3 py-1.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring'
                            />
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                              <div className='space-y-1'>
                                <label className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                                  {t('timeStart')}
                                </label>
                                <input
                                  type='datetime-local'
                                  value={editDraft.startedAt}
                                  onChange={(e) =>
                                    setEditDraft((d) => ({
                                      ...d,
                                      startedAt: e.target.value,
                                    }))
                                  }
                                  className='w-full bg-transparent border border-border rounded-md px-3 py-1.5 text-[11px] font-mono text-foreground focus:outline-none focus:border-ring'
                                />
                              </div>
                              <div className='space-y-1'>
                                <label className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                                  {t('timeEnd')}
                                </label>
                                <input
                                  type='datetime-local'
                                  value={editDraft.endedAt}
                                  onChange={(e) =>
                                    setEditDraft((d) => ({
                                      ...d,
                                      endedAt: e.target.value,
                                    }))
                                  }
                                  className='w-full bg-transparent border border-border rounded-md px-3 py-1.5 text-[11px] font-mono text-foreground focus:outline-none focus:border-ring'
                                />
                              </div>
                            </div>
                            {(() => {
                              const dur = computeManualDuration(
                                editDraft.startedAt,
                                editDraft.endedAt,
                              );
                              if (dur !== null) {
                                return (
                                  <div className='flex items-center gap-2'>
                                    <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                                      {t('timeDuration')}
                                    </span>
                                    <span className='font-mono text-sm text-amber-400'>
                                      {fmtDuration(dur, t)}
                                    </span>
                                  </div>
                                );
                              }
                              if (editDraft.startedAt && editDraft.endedAt) {
                                return (
                                  <p className='font-mono text-[10px] text-red-400'>
                                    {t('timeEndAfterStart')}
                                  </p>
                                );
                              }
                              return null;
                            })()}
                            <div className='flex items-center justify-end gap-3 pt-1'>
                              <button
                                onClick={() => confirmDelete(s.id)}
                                disabled={deleteSession.isPending}
                                className='p-1 text-muted-foreground hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50'
                              >
                                <Trash2Icon className='w-3.5 h-3.5' />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className='font-mono text-[10px] text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer'
                              >
                                {t('cancel')}
                              </button>
                              <button
                                onClick={() => saveEdit(s.id)}
                                disabled={
                                  updateSession.isPending ||
                                  computeManualDuration(
                                    editDraft.startedAt,
                                    editDraft.endedAt,
                                  ) === null
                                }
                                className='font-mono text-[10px] text-primary hover:opacity-80 bg-transparent border-none cursor-pointer disabled:opacity-50'
                              >
                                {t('timeSave')}
                              </button>
                            </div>
                          </li>
                        ) : (
                          <li
                            key={s.id}
                            className='group flex items-center justify-between px-5 py-3'
                          >
                            <div className='flex items-center gap-3 min-w-0'>
                              <span className='w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0' />
                              <div className='min-w-0'>
                                <span className='font-mono text-[11px] text-foreground'>
                                  {fmtTime(s.created)} → {fmtTime(s.ended_at!)}
                                </span>
                                {s.label && (
                                  <span className='ml-2 font-mono text-[10px] text-muted-foreground italic truncate'>
                                    {s.label}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className='flex items-center gap-3 shrink-0 ml-4'>
                              <span className='font-mono text-[11px] text-muted-foreground'>
                                {fmtDuration(s.final_duration_seconds ?? 0, t)}
                              </span>
                              <button
                                onClick={() => startEdit(s)}
                                className={cn(
                                  'p-1 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer',
                                  'opacity-0 group-hover:opacity-100',
                                )}
                              >
                                <PencilIcon className='w-3 h-3' />
                              </button>
                            </div>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
