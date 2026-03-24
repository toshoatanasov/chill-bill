import { useEffect, useReducer } from 'react'
import type { AppAction, AppState, Expense } from '@/types'
import { clearState, loadState, saveState } from '@/lib/storage'

const DEFAULT_STATE: AppState = {
  participants: [],
  expenses: [],
  currencySymbol: '€',
  currentStep: 0,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_PARTICIPANT':
      return {
        ...state,
        participants: [
          ...state.participants,
          { id: crypto.randomUUID(), name: action.name.trim() },
        ],
      }

    case 'REMOVE_PARTICIPANT': {
      const participants = state.participants.filter((p) => p.id !== action.id)
      // Remove expenses paid by or involving this participant
      const expenses = state.expenses.filter(
        (e) =>
          e.paidById !== action.id &&
          !e.splitAmong.includes(action.id),
      )
      return { ...state, participants, expenses }
    }

    case 'ADD_EXPENSE': {
      const expense: Expense = { ...action.expense, id: crypto.randomUUID() }
      return { ...state, expenses: [...state.expenses, expense] }
    }

    case 'REMOVE_EXPENSE':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) }

    case 'EDIT_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((e) => (e.id === action.expense.id ? action.expense : e)),
      }

    case 'SET_STEP':
      return { ...state, currentStep: action.step }

    case 'SET_CURRENCY_SYMBOL':
      return { ...state, currencySymbol: action.symbol }

    case 'RESET': {
      clearState()
      return DEFAULT_STATE
    }

    default:
      return state
  }
}

function getInitialState(): AppState {
  return loadState() ?? DEFAULT_STATE
}

export function useAppState() {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState)

  useEffect(() => {
    if (state !== DEFAULT_STATE) {
      saveState(state)
    }
  }, [state])

  return { state, dispatch }
}
