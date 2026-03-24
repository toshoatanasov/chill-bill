import { describe, it, expect, beforeEach } from 'vitest'
import { loadState, saveState, clearState, loadTheme, saveTheme } from './storage'
import type { AppState } from '@/types'

const mockState: AppState = {
  participants: [{ id: '1', name: 'Alice' }],
  expenses: [],
  currencySymbol: '€',
  currentStep: 0,
}

describe('loadState', () => {
  it('returns null when localStorage is empty', () => {
    expect(loadState()).toBeNull()
  })

  it('returns parsed AppState when valid JSON is stored', () => {
    localStorage.setItem('bill-split-state', JSON.stringify(mockState))
    expect(loadState()).toEqual(mockState)
  })

  it('returns null when stored JSON is malformed', () => {
    localStorage.setItem('bill-split-state', '{invalid json}')
    expect(loadState()).toBeNull()
  })
})

describe('saveState', () => {
  it('serializes state to localStorage under the correct key', () => {
    saveState(mockState)
    expect(localStorage.getItem('bill-split-state')).toBe(JSON.stringify(mockState))
  })

  it('overwrites a previously saved state', () => {
    saveState(mockState)
    const updated = { ...mockState, currencySymbol: '$' }
    saveState(updated)
    expect(loadState()).toEqual(updated)
  })
})

describe('clearState', () => {
  it('removes the state key from localStorage', () => {
    saveState(mockState)
    clearState()
    expect(localStorage.getItem('bill-split-state')).toBeNull()
  })

  it('is a no-op when key does not exist', () => {
    expect(() => clearState()).not.toThrow()
  })
})

describe('loadTheme', () => {
  it('returns null when no theme is saved', () => {
    expect(loadTheme()).toBeNull()
  })

  it('returns the saved theme string', () => {
    localStorage.setItem('bill-split-theme', 'dark')
    expect(loadTheme()).toBe('dark')
  })
})

describe('saveTheme', () => {
  it('persists the theme under the correct key', () => {
    saveTheme('dark')
    expect(localStorage.getItem('bill-split-theme')).toBe('dark')
  })

  it('overwrites a previously saved theme', () => {
    saveTheme('light')
    saveTheme('system')
    expect(loadTheme()).toBe('system')
  })
})
