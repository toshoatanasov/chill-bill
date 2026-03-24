export type SplitMode = 'equal' | 'percentage' | 'exact'

export interface Participant {
  id: string
  name: string
}

export interface SplitDetail {
  participantId: string
  value: number // percentage (0-100) or exact amount
}

export interface Expense {
  id: string
  description: string
  amount: number
  paidById: string
  splitMode: SplitMode
  splitAmong: string[] // participant IDs
  splitDetails: SplitDetail[] // for percentage/exact modes
}

export interface Transaction {
  fromId: string
  toId: string
  amount: number
}

export interface AppState {
  participants: Participant[]
  expenses: Expense[]
  currencySymbol: string
  currentStep: number
}

export type AppAction =
  | { type: 'ADD_PARTICIPANT'; name: string }
  | { type: 'REMOVE_PARTICIPANT'; id: string }
  | { type: 'ADD_EXPENSE'; expense: Omit<Expense, 'id'> }
  | { type: 'REMOVE_EXPENSE'; id: string }
  | { type: 'EDIT_EXPENSE'; expense: Expense }
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_CURRENCY_SYMBOL'; symbol: string }
  | { type: 'RESET' }
