import { useEffect, useMemo, useState } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'

  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  // Back-compat: prior versions stored "auto"
  if (stored === 'auto') return 'system'

  return 'system'
}

function resolveMode(mode: ThemeMode) {
  if (mode !== 'system') return mode
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyThemeMode(mode: ThemeMode) {
  const resolved = resolveMode(mode)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.documentElement.style.colorScheme = resolved
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('system')

  useEffect(() => {
    const initialMode = getInitialMode()
    setMode(initialMode)
    applyThemeMode(initialMode)
  }, [])

  useEffect(() => {
    if (mode !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  function toggleMode() {
    const nextMode: ThemeMode =
      mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'
    setMode(nextMode)
    applyThemeMode(nextMode)
    window.localStorage.setItem('theme', nextMode)
  }

  const { label, short } = useMemo(() => {
    if (mode === 'system') {
      const resolved = resolveMode('system')
      return {
        label: `Theme: system (${resolved}). Click to switch to light.`,
        short: 'System',
      }
    }
    return {
      label: `Theme: ${mode}. Click to switch theme.`,
      short: mode === 'dark' ? 'Dark' : 'Light',
    }
  }, [mode])

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className="rounded-full border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-sm font-semibold text-(--sea-ink) shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5"
    >
      {short}
    </button>
  )
}
