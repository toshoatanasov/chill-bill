import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppState } from './use-app-state'
import type { AppState } from '@/types'

const DEFAULT_STATE: AppState = {
  participants: [],
  expenses: [],
  currencySymbol: '€',
  currentStep: 'participants',
}

const savedState: AppState = {
  participants: [{ id: 'p1', name: 'Alice' }],
  expenses: [],
  currencySymbol: '€',
  currentStep: 'expenses',
}

describe('useAppState', () => {
  describe('initialization', () => {
    it('initializes with DEFAULT_STATE when localStorage is empty', () => {
      const { result } = renderHook(() => useAppState())
      expect(result.current.state).toEqual(DEFAULT_STATE)
    })

    it('initializes from localStorage when state is saved', () => {
      localStorage.setItem('bill-split-state', JSON.stringify(savedState))
      const { result } = renderHook(() => useAppState())
      expect(result.current.state).toEqual(savedState)
    })
  })

  describe('localStorage persistence', () => {
    it('saves state to localStorage after a dispatch', () => {
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({ type: 'ADD_PARTICIPANT', name: 'Alice' }))
      const stored = JSON.parse(localStorage.getItem('bill-split-state') ?? 'null')
      expect(stored?.participants[0].name).toBe('Alice')
    })
  })

  describe('ADD_PARTICIPANT', () => {
    it('adds a participant with the generated UUID', () => {
      vi.mocked(crypto.randomUUID).mockReturnValueOnce('uuid-1' as `${string}-${string}-${string}-${string}-${string}`)
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({ type: 'ADD_PARTICIPANT', name: 'Alice' }))
      expect(result.current.state.participants[0]).toEqual({ id: 'uuid-1', name: 'Alice' })
    })

    it('trims whitespace from the name', () => {
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({ type: 'ADD_PARTICIPANT', name: '  Bob  ' }))
      expect(result.current.state.participants[0].name).toBe('Bob')
    })

    it('appends to existing participants', () => {
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({ type: 'ADD_PARTICIPANT', name: 'Alice' }))
      act(() => result.current.dispatch({ type: 'ADD_PARTICIPANT', name: 'Bob' }))
      expect(result.current.state.participants).toHaveLength(2)
    })
  })

  describe('REMOVE_PARTICIPANT', () => {
    it('removes the participant by id', () => {
      localStorage.setItem('bill-split-state', JSON.stringify({
        ...DEFAULT_STATE,
        participants: [
          { id: 'p1', name: 'Alice' },
          { id: 'p2', name: 'Bob' },
        ],
      }))
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({ type: 'REMOVE_PARTICIPANT', id: 'p1' }))
      expect(result.current.state.participants).toHaveLength(1)
      expect(result.current.state.participants[0].id).toBe('p2')
    })

    it('cascades: removes expenses where paidById matches removed participant', () => {
      localStorage.setItem('bill-split-state', JSON.stringify({
        ...DEFAULT_STATE,
        participants: [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
        expenses: [{
          id: 'e1', description: 'Test', amount: 10,
          paidById: 'p1', splitMode: 'equal', splitAmong: ['p2'], splitDetails: [],
        }],
      }))
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({ type: 'REMOVE_PARTICIPANT', id: 'p1' }))
      expect(result.current.state.expenses).toHaveLength(0)
    })

    it('cascades: removes expenses where removed participant is in splitAmong', () => {
      localStorage.setItem('bill-split-state', JSON.stringify({
        ...DEFAULT_STATE,
        participants: [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
        expenses: [{
          id: 'e1', description: 'Test', amount: 10,
          paidById: 'p1', splitMode: 'equal', splitAmong: ['p1', 'p2'], splitDetails: [],
        }],
      }))
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({ type: 'REMOVE_PARTICIPANT', id: 'p2' }))
      expect(result.current.state.expenses).toHaveLength(0)
    })

    it('preserves expenses not involving the removed participant', () => {
      localStorage.setItem('bill-split-state', JSON.stringify({
        ...DEFAULT_STATE,
        participants: [
          { id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }, { id: 'p3', name: 'Charlie' },
        ],
        expenses: [
          {
            id: 'e1', description: 'Unrelated', amount: 10,
            paidById: 'p1', splitMode: 'equal', splitAmong: ['p1', 'p2'], splitDetails: [],
          },
        ],
      }))
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({ type: 'REMOVE_PARTICIPANT', id: 'p3' }))
      expect(result.current.state.expenses).toHaveLength(1)
    })
  })

  describe('ADD_EXPENSE', () => {
    it('adds expense with a new UUID', () => {
      vi.mocked(crypto.randomUUID).mockReturnValueOnce('e-uuid' as `${string}-${string}-${string}-${string}-${string}`)
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({
        type: 'ADD_EXPENSE',
        expense: {
          description: 'Dinner', amount: 50, paidById: 'p1',
          splitMode: 'equal', splitAmong: ['p1'], splitDetails: [],
        },
      }))
      expect(result.current.state.expenses[0].id).toBe('e-uuid')
    })
  })

  describe('REMOVE_EXPENSE', () => {
    it('removes expense by id and preserves others', () => {
      localStorage.setItem('bill-split-state', JSON.stringify({
        ...DEFAULT_STATE,
        expenses: [
          { id: 'e1', description: 'A', amount: 10, paidById: 'p1', splitMode: 'equal', splitAmong: [], splitDetails: [] },
          { id: 'e2', description: 'B', amount: 20, paidById: 'p1', splitMode: 'equal', splitAmong: [], splitDetails: [] },
        ],
      }))
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({ type: 'REMOVE_EXPENSE', id: 'e1' }))
      expect(result.current.state.expenses).toHaveLength(1)
      expect(result.current.state.expenses[0].id).toBe('e2')
    })
  })

  describe('EDIT_EXPENSE', () => {
    it('replaces expense with matching id', () => {
      localStorage.setItem('bill-split-state', JSON.stringify({
        ...DEFAULT_STATE,
        expenses: [
          { id: 'e1', description: 'Old', amount: 10, paidById: 'p1', splitMode: 'equal', splitAmong: [], splitDetails: [] },
        ],
      }))
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({
        type: 'EDIT_EXPENSE',
        expense: { id: 'e1', description: 'New', amount: 20, paidById: 'p1', splitMode: 'equal', splitAmong: [], splitDetails: [] },
      }))
      expect(result.current.state.expenses[0].description).toBe('New')
      expect(result.current.state.expenses).toHaveLength(1)
    })
  })

  describe('SET_STEP', () => {
    it('updates currentStep', () => {
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({ type: 'SET_STEP', step: 'settlement' }))
      expect(result.current.state.currentStep).toBe('settlement')
    })
  })

  describe('SET_CURRENCY_SYMBOL', () => {
    it('updates currencySymbol', () => {
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({ type: 'SET_CURRENCY_SYMBOL', symbol: '$' }))
      expect(result.current.state.currencySymbol).toBe('$')
    })
  })

  describe('RESET', () => {
    it('resets state to DEFAULT_STATE', () => {
      localStorage.setItem('bill-split-state', JSON.stringify(savedState))
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({ type: 'RESET' }))
      expect(result.current.state).toEqual(DEFAULT_STATE)
    })

    it('clears localStorage on RESET', () => {
      localStorage.setItem('bill-split-state', JSON.stringify(savedState))
      const { result } = renderHook(() => useAppState())
      act(() => result.current.dispatch({ type: 'RESET' }))
      expect(localStorage.getItem('bill-split-state')).toBeNull()
    })
  })
})
