import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseList } from './expense-list'
import type { AppState } from '@/types'

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    participants: [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ],
    expenses: [
      {
        id: 'e1',
        description: 'Birthday gift',
        amount: 50,
        paidById: 'p1',
        splitMode: 'equal',
        splitAmong: ['p1', 'p2'],
        splitDetails: [],
      },
    ],
    currencySymbol: '€',
    currentStep: 'expenses',
    ...overrides,
  }
}

describe('ExpenseList', () => {
  describe('empty state', () => {
    it('shows empty state message when no expenses', () => {
      render(<ExpenseList state={makeState({ expenses: [] })} dispatch={vi.fn()} />)
      expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument()
    })
  })

  describe('with expenses', () => {
    it('displays expense description', () => {
      render(<ExpenseList state={makeState()} dispatch={vi.fn()} />)
      expect(screen.getByText('Birthday gift')).toBeInTheDocument()
    })

    it('displays formatted amount', () => {
      render(<ExpenseList state={makeState()} dispatch={vi.fn()} />)
      expect(screen.getByText('50.00 €')).toBeInTheDocument()
    })

    it('displays payer name', () => {
      render(<ExpenseList state={makeState()} dispatch={vi.fn()} />)
      expect(screen.getByText(/paid by alice/i)).toBeInTheDocument()
    })

    it('displays split mode badge', () => {
      render(<ExpenseList state={makeState()} dispatch={vi.fn()} />)
      expect(screen.getByText('Equal')).toBeInTheDocument()
    })

    it('shows total amount', () => {
      render(<ExpenseList state={makeState()} dispatch={vi.fn()} />)
      expect(screen.getByText('Total: 50.00 €')).toBeInTheDocument()
    })

    it('shows "1 expense" (singular)', () => {
      render(<ExpenseList state={makeState()} dispatch={vi.fn()} />)
      expect(screen.getByText(/1 expense$/)).toBeInTheDocument()
    })

    it('shows plural "expenses" for multiple', () => {
      const state = makeState({
        expenses: [
          { id: 'e1', description: 'A', amount: 10, paidById: 'p1', splitMode: 'equal', splitAmong: ['p1'], splitDetails: [] },
          { id: 'e2', description: 'B', amount: 20, paidById: 'p1', splitMode: 'equal', splitAmong: ['p1'], splitDetails: [] },
        ],
      })
      render(<ExpenseList state={state} dispatch={vi.fn()} />)
      expect(screen.getByText(/2 expenses/)).toBeInTheDocument()
    })

    it('shows "Unknown" when paidById does not match any participant', () => {
      const state = makeState({
        expenses: [{
          id: 'e1', description: 'Mystery', amount: 10,
          paidById: 'nobody', splitMode: 'equal', splitAmong: [], splitDetails: [],
        }],
      })
      render(<ExpenseList state={state} dispatch={vi.fn()} />)
      expect(screen.getByText(/paid by unknown/i)).toBeInTheDocument()
    })
  })

  describe('delete', () => {
    it('dispatches REMOVE_EXPENSE on trash button click', async () => {
      const user = userEvent.setup()
      const dispatch = vi.fn()
      render(<ExpenseList state={makeState()} dispatch={dispatch} />)
      await user.click(screen.getByRole('button', { name: /remove expense/i }))
      expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_EXPENSE', id: 'e1' })
    })
  })

  describe('edit dialog', () => {
    it('opens edit dialog when pencil button is clicked', async () => {
      const user = userEvent.setup()
      render(<ExpenseList state={makeState()} dispatch={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /edit expense/i }))
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })

    it('closes dialog when Cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<ExpenseList state={makeState()} dispatch={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /edit expense/i }))
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument()
    })
  })
})
