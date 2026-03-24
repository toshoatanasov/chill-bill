import type { AppState } from '@/types'

const STATE_KEY = 'bill-split-state'
const THEME_KEY = 'bill-split-theme'

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    return raw ? (JSON.parse(raw) as AppState) : null
  } catch {
    return null
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STATE_KEY, JSON.stringify(state))
}

export function clearState(): void {
  localStorage.removeItem(STATE_KEY)
}

export function loadTheme(): string | null {
  return localStorage.getItem(THEME_KEY)
}

export function saveTheme(theme: string): void {
  localStorage.setItem(THEME_KEY, theme)
}
