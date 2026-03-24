import { describe, it, expect } from 'vitest'
import { validatePercentageSplit, validateExactSplit, validateExpense } from './validation'
import type { Expense, SplitDetail } from '@/types'

const pct = (values: number[]): SplitDetail[] =>
  values.map((value, i) => ({ participantId: `p${i}`, value }))

const exact = (values: number[]): SplitDetail[] =>
  values.map((value, i) => ({ participantId: `p${i}`, value }))

function makeExpense(overrides: Partial<Omit<Expense, 'id'>>): Omit<Expense, 'id'> {
  return {
    description: 'Dinner',
    amount: 100,
    paidById: 'p1',
    splitMode: 'equal',
    splitAmong: ['p1', 'p2'],
    splitDetails: [],
    ...overrides,
  }
}

describe('validatePercentageSplit', () => {
  it('returns true when percentages sum to exactly 100', () => {
    expect(validatePercentageSplit(pct([50, 50]))).toBe(true)
  })

  it('returns true within epsilon (3-way split summing to 100)', () => {
    expect(validatePercentageSplit(pct([33.33, 33.33, 33.34]))).toBe(true)
  })

  it('returns false when sum is below 100 beyond epsilon', () => {
    expect(validatePercentageSplit(pct([40, 40]))).toBe(false)
  })

  it('returns false when sum exceeds 100 beyond epsilon', () => {
    expect(validatePercentageSplit(pct([60, 60]))).toBe(false)
  })

  it('returns false for empty array (sum is 0)', () => {
    expect(validatePercentageSplit([])).toBe(false)
  })
})

describe('validateExactSplit', () => {
  it('returns true when exact amounts sum to total', () => {
    expect(validateExactSplit(exact([30, 70]), 100)).toBe(true)
  })

  it('returns true for single participant covering full amount', () => {
    expect(validateExactSplit(exact([100]), 100)).toBe(true)
  })

  it('returns false when sum differs by more than epsilon', () => {
    expect(validateExactSplit(exact([30, 30]), 100)).toBe(false)
  })

  it('returns false when difference is at epsilon boundary (0.01)', () => {
    // epsilon is strict < 0.01, so exactly 0.01 difference → false
    expect(validateExactSplit(exact([99.99]), 100)).toBe(false)
  })
})

describe('validateExpense', () => {
  describe('description', () => {
    it('adds error for empty description', () => {
      const errors = validateExpense(makeExpense({ description: '' }))
      expect(errors).toContain('Description is required.')
    })

    it('adds error for whitespace-only description', () => {
      const errors = validateExpense(makeExpense({ description: '   ' }))
      expect(errors).toContain('Description is required.')
    })

    it('no error when description has content', () => {
      const errors = validateExpense(makeExpense({ description: 'Dinner' }))
      expect(errors).not.toContain('Description is required.')
    })
  })

  describe('amount', () => {
    it('adds error when amount is 0', () => {
      const errors = validateExpense(makeExpense({ amount: 0 }))
      expect(errors).toContain('Amount must be greater than zero.')
    })

    it('adds error when amount is negative', () => {
      const errors = validateExpense(makeExpense({ amount: -5 }))
      expect(errors).toContain('Amount must be greater than zero.')
    })

    it('adds error when amount is NaN', () => {
      const errors = validateExpense(makeExpense({ amount: NaN }))
      expect(errors).toContain('Amount must be greater than zero.')
    })

    it('no error for positive amount', () => {
      const errors = validateExpense(makeExpense({ amount: 50 }))
      expect(errors).not.toContain('Amount must be greater than zero.')
    })
  })

  describe('paidById', () => {
    it('adds error when paidById is empty', () => {
      const errors = validateExpense(makeExpense({ paidById: '' }))
      expect(errors).toContain('Select who paid.')
    })

    it('no error when paidById is set', () => {
      const errors = validateExpense(makeExpense({ paidById: 'p1' }))
      expect(errors).not.toContain('Select who paid.')
    })
  })

  describe('splitAmong', () => {
    it('adds error when splitAmong is empty', () => {
      const errors = validateExpense(makeExpense({ splitAmong: [] }))
      expect(errors).toContain('At least one person must be in the split.')
    })

    it('no error with at least one participant', () => {
      const errors = validateExpense(makeExpense({ splitAmong: ['p1'] }))
      expect(errors).not.toContain('At least one person must be in the split.')
    })
  })

  describe('percentage mode', () => {
    it('adds error when percentages do not sum to 100', () => {
      const errors = validateExpense(makeExpense({
        splitMode: 'percentage',
        splitDetails: pct([40, 40]),
      }))
      expect(errors).toContain('Percentages must add up to 100%.')
    })

    it('no error when percentages sum to 100', () => {
      const errors = validateExpense(makeExpense({
        splitMode: 'percentage',
        splitDetails: pct([60, 40]),
      }))
      expect(errors).not.toContain('Percentages must add up to 100%.')
    })
  })

  describe('exact mode', () => {
    it('adds error with formatted amount when exact amounts do not match', () => {
      const errors = validateExpense(makeExpense({
        amount: 50,
        splitMode: 'exact',
        splitDetails: exact([20, 20]),
      }))
      expect(errors).toContain('Exact amounts must add up to 50.00.')
    })

    it('no error when exact amounts sum to total', () => {
      const errors = validateExpense(makeExpense({
        amount: 50,
        splitMode: 'exact',
        splitDetails: exact([30, 20]),
      }))
      expect(errors).not.toContain('Exact amounts must add up to 50.00.')
    })
  })

  describe('equal mode', () => {
    it('does not run split validation for equal mode', () => {
      const errors = validateExpense(makeExpense({ splitMode: 'equal', splitDetails: [] }))
      expect(errors).toHaveLength(0)
    })
  })

  describe('multiple errors', () => {
    it('returns all errors for a completely invalid expense', () => {
      const errors = validateExpense({
        description: '',
        amount: 0,
        paidById: '',
        splitMode: 'equal',
        splitAmong: [],
        splitDetails: [],
      })
      expect(errors.length).toBeGreaterThanOrEqual(4)
      expect(errors).toContain('Description is required.')
      expect(errors).toContain('Amount must be greater than zero.')
      expect(errors).toContain('Select who paid.')
      expect(errors).toContain('At least one person must be in the split.')
    })
  })

  describe('fully valid expenses', () => {
    it('returns empty array for valid equal-split expense', () => {
      expect(validateExpense(makeExpense({}))).toEqual([])
    })

    it('returns empty array for valid percentage expense', () => {
      expect(validateExpense(makeExpense({
        splitMode: 'percentage',
        splitDetails: pct([60, 40]),
      }))).toEqual([])
    })

    it('returns empty array for valid exact expense', () => {
      expect(validateExpense(makeExpense({
        amount: 100,
        splitMode: 'exact',
        splitDetails: exact([60, 40]),
      }))).toEqual([])
    })
  })
})
