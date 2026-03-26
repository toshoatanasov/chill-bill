import type { AppState, Step } from '@/types'

const STATE_KEY = 'bill-split-state'
const THEME_KEY = 'bill-split-theme'

const VALID_STEPS: Step[] = ['participants', 'expenses', 'settlement']

const LEGACY_STEP_MAP: Record<number, Step> = {
  0: 'participants',
  1: 'expenses',
  2: 'settlement',
}

function migrateState(obj: Record<string, unknown>): void {
  if (typeof obj.currentStep === 'number' && obj.currentStep in LEGACY_STEP_MAP) {
    obj.currentStep = LEGACY_STEP_MAP[obj.currentStep]
  }
}

function isValidState(value: unknown): value is AppState {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    Array.isArray(obj.participants) &&
    Array.isArray(obj.expenses) &&
    typeof obj.currencySymbol === 'string' &&
    typeof obj.currentStep === 'string' &&
    VALID_STEPS.includes(obj.currentStep as Step)
  )
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) {
      migrateState(parsed as Record<string, unknown>)
    }
    return isValidState(parsed) ? parsed : null
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
