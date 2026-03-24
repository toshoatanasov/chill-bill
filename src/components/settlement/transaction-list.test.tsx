import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionList } from './transaction-list'
import type { Participant, Transaction } from '@/types'

const participants: Participant[] = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
  { id: 'charlie', name: 'Charlie' },
]

const transactions: Transaction[] = [
  { fromId: 'bob', toId: 'alice', amount: 25 },
  { fromId: 'charlie', toId: 'alice', amount: 10 },
]

describe('TransactionList', () => {
  describe('empty state', () => {
    it('shows settled-up message when no transactions', () => {
      render(<TransactionList transactions={[]} participants={participants} currencySymbol="€" />)
      expect(screen.getByText(/everyone is settled up/i)).toBeInTheDocument()
    })
  })

  describe('with transactions', () => {
    it('renders a card for each transaction', () => {
      render(<TransactionList transactions={transactions} participants={participants} currencySymbol="€" />)
      // Both transactions rendered — verify both names present
      expect(screen.getAllByText('Alice')).toHaveLength(2) // Alice appears twice (receives)
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()
    })

    it('displays formatted amounts', () => {
      render(<TransactionList transactions={transactions} participants={participants} currencySymbol="€" />)
      expect(screen.getByText('25.00 €')).toBeInTheDocument()
      expect(screen.getByText('10.00 €')).toBeInTheDocument()
    })

    it('shows "Unknown" when participant id not found', () => {
      const badTransaction: Transaction[] = [{ fromId: 'nobody', toId: 'alice', amount: 5 }]
      render(<TransactionList transactions={badTransaction} participants={participants} currencySymbol="€" />)
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })
})
