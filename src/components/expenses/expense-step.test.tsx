import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseStep } from './expense-step'
import type { AppAction, AppState } from '@/types'

function makeState(expenseCount = 0): AppState {
  return {
    participants: [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
    expenses: Array.from({ length: expenseCount }, (_, i) => ({
      id: `e${i}`, description: `Expense ${i}`, amount: 10,
      paidById: 'p1', splitMode: 'equal' as const, splitAmong: ['p1', 'p2'], splitDetails: [],
    })),
    currencySymbol: '€',
    currentStep: 1,
  }
}

describe('ExpenseStep', () => {
  describe('rendering', () => {
    it('renders Expenses card title', () => {
      render(<ExpenseStep state={makeState()} dispatch={vi.fn()} />)
      expect(screen.getByText('Expenses')).toBeInTheDocument()
    })

    it('renders Back and Calculate Settlement buttons', () => {
      render(<ExpenseStep state={makeState()} dispatch={vi.fn()} />)
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /calculate settlement/i })).toBeInTheDocument()
    })
  })

  describe('Calculate Settlement button', () => {
    it('is disabled when no expenses', () => {
      render(<ExpenseStep state={makeState(0)} dispatch={vi.fn()} />)
      expect(screen.getByRole('button', { name: /calculate settlement/i })).toBeDisabled()
    })

    it('is enabled with at least one expense', () => {
      render(<ExpenseStep state={makeState(1)} dispatch={vi.fn()} />)
      expect(screen.getByRole('button', { name: /calculate settlement/i })).toBeEnabled()
    })
  })

  describe('navigation', () => {
    it('dispatches SET_STEP 0 on Back click', async () => {
      const user = userEvent.setup()
      const dispatch = vi.fn<[AppAction], void>()
      render(<ExpenseStep state={makeState()} dispatch={dispatch} />)
      await user.click(screen.getByRole('button', { name: /back/i }))
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_STEP', step: 0 })
    })

    it('dispatches SET_STEP 2 on Calculate Settlement click', async () => {
      const user = userEvent.setup()
      const dispatch = vi.fn<[AppAction], void>()
      render(<ExpenseStep state={makeState(1)} dispatch={dispatch} />)
      await user.click(screen.getByRole('button', { name: /calculate settlement/i }))
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_STEP', step: 2 })
    })
  })
})
