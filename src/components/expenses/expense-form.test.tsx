import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseForm } from './expense-form'
import type { Expense, Participant } from '@/types'

const participants: Participant[] = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
]

const editingExpense: Expense = {
  id: 'e1',
  description: 'Dinner',
  amount: 50,
  paidById: 'p1',
  splitMode: 'equal',
  splitAmong: ['p1', 'p2'],
  splitDetails: [],
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/description/i), 'Gift')
  await user.type(screen.getByLabelText(/amount/i), '100')
}

describe('ExpenseForm', () => {
  describe('add mode (no editingExpense)', () => {
    it('renders description and amount inputs', () => {
      render(<ExpenseForm participants={participants} onSubmit={vi.fn()} />)
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    })

    it('renders "Add Expense" button', () => {
      render(<ExpenseForm participants={participants} onSubmit={vi.fn()} />)
      expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument()
    })

    it('does not render Cancel button without onCancel', () => {
      render(<ExpenseForm participants={participants} onSubmit={vi.fn()} />)
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
    })

    it('renders Cancel button when onCancel is provided', () => {
      render(<ExpenseForm participants={participants} onSubmit={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('shows validation errors when submitted with empty fields', async () => {
      const user = userEvent.setup()
      render(<ExpenseForm participants={participants} onSubmit={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /add expense/i }))
      expect(screen.getByText(/description is required/i)).toBeInTheDocument()
    })

    it('does not call onSubmit when validation fails', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<ExpenseForm participants={participants} onSubmit={onSubmit} />)
      await user.click(screen.getByRole('button', { name: /add expense/i }))
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('clears validation errors when user types in description', async () => {
      const user = userEvent.setup()
      render(<ExpenseForm participants={participants} onSubmit={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /add expense/i }))
      expect(screen.getByText(/description is required/i)).toBeInTheDocument()
      await user.type(screen.getByLabelText(/description/i), 'Gift')
      expect(screen.queryByText(/description is required/i)).not.toBeInTheDocument()
    })

    it('clears validation errors when user types in amount', async () => {
      const user = userEvent.setup()
      render(<ExpenseForm participants={participants} onSubmit={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /add expense/i }))
      expect(screen.getByText(/description is required/i)).toBeInTheDocument()
      await user.type(screen.getByLabelText(/amount/i), '50')
      // Errors cleared on any input change
      expect(screen.queryByText(/description is required/i)).not.toBeInTheDocument()
    })
  })

  describe('edit mode', () => {
    it('pre-fills description from editingExpense', () => {
      render(<ExpenseForm participants={participants} editingExpense={editingExpense} onSubmit={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByLabelText(/description/i)).toHaveValue('Dinner')
    })

    it('pre-fills amount from editingExpense', () => {
      render(<ExpenseForm participants={participants} editingExpense={editingExpense} onSubmit={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByLabelText(/amount/i)).toHaveValue(50)
    })

    it('renders "Save Changes" button', () => {
      render(<ExpenseForm participants={participants} editingExpense={editingExpense} onSubmit={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })

    it('calls onCancel when Cancel is clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      render(<ExpenseForm participants={participants} editingExpense={editingExpense} onSubmit={vi.fn()} onCancel={onCancel} />)
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      expect(onCancel).toHaveBeenCalled()
    })
  })

  describe('split mode tabs', () => {
    it('renders Equal, Percentage, and Exact tabs', () => {
      render(<ExpenseForm participants={participants} onSubmit={vi.fn()} />)
      expect(screen.getByRole('tab', { name: /equal/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /percentage/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /exact/i })).toBeInTheDocument()
    })

    it('switches to percentage mode when Percentage tab clicked', async () => {
      const user = userEvent.setup()
      render(<ExpenseForm participants={participants} onSubmit={vi.fn()} />)
      await user.click(screen.getByRole('tab', { name: /percentage/i }))
      // Percentage mode shows number inputs (not checkboxes)
      expect(screen.getByText(/enter percentages/i)).toBeInTheDocument()
    })

    it('switches to exact mode when Exact tab clicked', async () => {
      const user = userEvent.setup()
      render(<ExpenseForm participants={participants} onSubmit={vi.fn()} />)
      await user.click(screen.getByRole('tab', { name: /exact/i }))
      expect(screen.getByText(/enter exact amounts/i)).toBeInTheDocument()
    })
  })
})
