import { describe, it, expect } from 'vitest'
import { computeSettlement } from './settlement'
import type { Expense, Participant } from '@/types'

function p(id: string, name: string): Participant {
  return { id, name }
}

function equalExpense(
  id: string,
  paidById: string,
  amount: number,
  splitAmong: string[],
): Expense {
  return { id, description: 'Test', amount, paidById, splitMode: 'equal', splitAmong, splitDetails: [] }
}

function pctExpense(
  id: string,
  paidById: string,
  amount: number,
  details: Array<{ id: string; pct: number }>,
): Expense {
  return {
    id, description: 'Test', amount, paidById,
    splitMode: 'percentage',
    splitAmong: details.map(d => d.id),
    splitDetails: details.map(d => ({ participantId: d.id, value: d.pct })),
  }
}

function exactExpense(
  id: string,
  paidById: string,
  amount: number,
  details: Array<{ id: string; value: number }>,
): Expense {
  return {
    id, description: 'Test', amount, paidById,
    splitMode: 'exact',
    splitAmong: details.map(d => d.id),
    splitDetails: details.map(d => ({ participantId: d.id, value: d.value })),
  }
}

const alice = p('alice', 'Alice')
const bob = p('bob', 'Bob')
const charlie = p('charlie', 'Charlie')

describe('computeSettlement', () => {
  describe('empty inputs', () => {
    it('returns [] when no expenses', () => {
      expect(computeSettlement([alice, bob], [])).toEqual([])
    })

    it('returns [] when no participants', () => {
      expect(computeSettlement([], [])).toEqual([])
    })
  })

  describe('all-equal — no transactions needed', () => {
    it('returns [] when each person paid exactly their own share', () => {
      // Alice paid 50 split A+B, Bob paid 50 split A+B → net 0 each
      const expenses = [
        equalExpense('e1', 'alice', 50, ['alice', 'bob']),
        equalExpense('e2', 'bob', 50, ['alice', 'bob']),
      ]
      expect(computeSettlement([alice, bob], expenses)).toEqual([])
    })

    it('returns [] for three-way balanced split', () => {
      // Each pays 30, all three split equally → each paid 30, owed 30
      const expenses = [
        equalExpense('e1', 'alice', 30, ['alice', 'bob', 'charlie']),
        equalExpense('e2', 'bob', 30, ['alice', 'bob', 'charlie']),
        equalExpense('e3', 'charlie', 30, ['alice', 'bob', 'charlie']),
      ]
      expect(computeSettlement([alice, bob, charlie], expenses)).toEqual([])
    })
  })

  describe('simple 2-person split', () => {
    it('produces one transaction when A paid for both', () => {
      // Alice pays 100, equal split → each owes 50. Bob owes Alice 50.
      const expenses = [equalExpense('e1', 'alice', 100, ['alice', 'bob'])]
      const result = computeSettlement([alice, bob], expenses)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ fromId: 'bob', toId: 'alice', amount: 50 })
    })

    it('produces correct amount when payer is not in splitAmong', () => {
      // Alice pays 30, split among Bob only → Bob owes Alice 30
      const expenses = [equalExpense('e1', 'alice', 30, ['bob'])]
      const result = computeSettlement([alice, bob], expenses)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ fromId: 'bob', toId: 'alice', amount: 30 })
    })
  })

  describe('3-person greedy minimization', () => {
    it('minimizes to 2 transactions for 3 participants', () => {
      // Alice pays 90 (split 3 ways, each owes 30). Bob pays 30 (split 3 ways, each owes 10).
      // Net: Alice = +90 - 30 - 10 = +50, Bob = +30 - 30 - 10 = -10, Charlie = 0 - 30 - 10 = -40
      const expenses = [
        equalExpense('e1', 'alice', 90, ['alice', 'bob', 'charlie']),
        equalExpense('e2', 'bob', 30, ['alice', 'bob', 'charlie']),
      ]
      const result = computeSettlement([alice, bob, charlie], expenses)
      expect(result).toHaveLength(2)
      const totalPaid = result.reduce((s, t) => s + t.amount, 0)
      expect(Math.abs(totalPaid - 50)).toBeLessThan(0.01) // all debt settled
      // Charlie (debtor 40) settles first
      const charlieTransaction = result.find(t => t.fromId === 'charlie')
      expect(charlieTransaction?.toId).toBe('alice')
      expect(charlieTransaction?.amount).toBe(40)
      const bobTransaction = result.find(t => t.fromId === 'bob')
      expect(bobTransaction?.toId).toBe('alice')
      expect(bobTransaction?.amount).toBe(10)
    })
  })

  describe('netting', () => {
    it('nets out a participant who both paid and owes', () => {
      // Alice pays 60 for A+B+C (each owes 20). Bob pays 30 for A+B (each owes 15).
      // Alice net: +60 - 20 - 15 = +25
      // Bob net:   +30 - 20 - 15 = -5
      // Charlie:    0  - 20 -  0 = -20
      // Transactions: Charlie→Alice 20, Bob→Alice 5
      const expenses = [
        equalExpense('e1', 'alice', 60, ['alice', 'bob', 'charlie']),
        equalExpense('e2', 'bob', 30, ['alice', 'bob']),
      ]
      const result = computeSettlement([alice, bob, charlie], expenses)
      expect(result).toHaveLength(2)
      expect(result.find(t => t.fromId === 'charlie')).toMatchObject({ toId: 'alice', amount: 20 })
      expect(result.find(t => t.fromId === 'bob')).toMatchObject({ toId: 'alice', amount: 5 })
    })

    it('produces no transaction for a participant with zero net balance', () => {
      // Alice pays 50 split A+B (Alice net +25), Bob pays 50 split A+B (Bob net +25)
      // Wait, that gives both net +25: impossible since sum must be 0.
      // Correct: Alice pays 50 for A+B, Bob pays 50 for A+B → Alice: +50-25=+25, Bob: +50-25=+25
      // That sums to +50, invalid. Use: Alice pays 100 split A+B → Alice +50, Bob -50.
      // Bob pays 50 split B only → Bob +50-50=0. Alice +50. Charlie doesn't exist in this.
      // Net: Alice +50, Bob 0 → no transaction for Bob, and no creditor for Alice?? Not valid.
      // Better: Alice pays 100 for A+B+C. Bob pays 50 for B+C. Charlie pays 50 for A+C.
      // Alice: +100-100/3 = +66.67 approx. Too complex.
      // Simple: Alice pays 60 (A+B equal, each 30). Bob pays 60 (A+B equal, each 30).
      // Alice net: +60-30-30=0. Bob net: +60-30-30=0. → []
      const expenses = [
        equalExpense('e1', 'alice', 60, ['alice', 'bob']),
        equalExpense('e2', 'bob', 60, ['alice', 'bob']),
      ]
      expect(computeSettlement([alice, bob], expenses)).toEqual([])
    })
  })

  describe('percentage split', () => {
    it('computes shares for 60/40 split', () => {
      // Alice pays 100, Alice 60%, Bob 40% → Alice net +40, Bob owes 40
      const expenses = [pctExpense('e1', 'alice', 100, [
        { id: 'alice', pct: 60 },
        { id: 'bob', pct: 40 },
      ])]
      const result = computeSettlement([alice, bob], expenses)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ fromId: 'bob', toId: 'alice', amount: 40 })
    })

    it('handles unequal 3-way percentage split', () => {
      // Alice pays 100. Split: Alice 50%, Bob 30%, Charlie 20%
      // Alice net: +100 - 50 = +50, Bob: -30, Charlie: -20
      const expenses = [pctExpense('e1', 'alice', 100, [
        { id: 'alice', pct: 50 },
        { id: 'bob', pct: 30 },
        { id: 'charlie', pct: 20 },
      ])]
      const result = computeSettlement([alice, bob, charlie], expenses)
      expect(result).toHaveLength(2)
      expect(result.find(t => t.fromId === 'bob')?.amount).toBe(30)
      expect(result.find(t => t.fromId === 'charlie')?.amount).toBe(20)
    })
  })

  describe('exact split', () => {
    it('computes shares from exact values', () => {
      // Alice pays 75, Bob owes 25, Charlie owes 50
      const expenses = [exactExpense('e1', 'alice', 75, [
        { id: 'bob', value: 25 },
        { id: 'charlie', value: 50 },
      ])]
      const result = computeSettlement([alice, bob, charlie], expenses)
      expect(result).toHaveLength(2)
      expect(result.find(t => t.fromId === 'charlie')).toMatchObject({ toId: 'alice', amount: 50 })
      expect(result.find(t => t.fromId === 'bob')).toMatchObject({ toId: 'alice', amount: 25 })
    })
  })

  describe('rounding precision', () => {
    it('produces 2-decimal amounts when amount does not divide evenly', () => {
      // Alice pays 10, split 3 ways (each owes 3.333...)
      // Alice net: +10 - 3.333 = +6.667 → creditor
      // Bob and Charlie each owe 3.33
      const expenses = [equalExpense('e1', 'alice', 10, ['alice', 'bob', 'charlie'])]
      const result = computeSettlement([alice, bob, charlie], expenses)
      result.forEach(t => {
        expect(Number.isInteger(t.amount * 100)).toBe(true) // max 2dp
        expect(t.amount).toBeGreaterThan(0)
      })
    })

    it('filters near-zero balances below 0.005 threshold', () => {
      // Alice pays 100, split: Alice 99.996, Bob 0.004 → Bob balance < threshold → no transaction
      const expenses = [exactExpense('e1', 'alice', 100, [
        { id: 'alice', value: 99.996 },
        { id: 'bob', value: 0.004 },
      ])]
      const result = computeSettlement([alice, bob], expenses)
      expect(result).toHaveLength(0)
    })
  })

  describe('multiple expenses, same payer', () => {
    it('aggregates payments by the same person correctly', () => {
      // Alice pays 50 and 30, both equal splits with Bob
      // Alice net: +80 - 40 = +40. Bob: -40.
      const expenses = [
        equalExpense('e1', 'alice', 50, ['alice', 'bob']),
        equalExpense('e2', 'alice', 30, ['alice', 'bob']),
      ]
      const result = computeSettlement([alice, bob], expenses)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ fromId: 'bob', toId: 'alice', amount: 40 })
    })
  })

  describe('result structure', () => {
    it('each transaction has fromId, toId, and positive amount', () => {
      const expenses = [equalExpense('e1', 'alice', 100, ['alice', 'bob'])]
      const result = computeSettlement([alice, bob], expenses)
      expect(result[0]).toHaveProperty('fromId')
      expect(result[0]).toHaveProperty('toId')
      expect(result[0].amount).toBeGreaterThan(0)
    })
  })
})
