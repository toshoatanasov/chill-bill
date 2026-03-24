import type { Expense, SplitDetail } from '@/types'

const EPSILON = 0.01

export function validatePercentageSplit(details: SplitDetail[]): boolean {
  const sum = details.reduce((acc, d) => acc + d.value, 0)
  return Math.abs(sum - 100) < EPSILON
}

export function validateExactSplit(details: SplitDetail[], total: number): boolean {
  const sum = details.reduce((acc, d) => acc + d.value, 0)
  return Math.abs(sum - total) < EPSILON
}

export function validateExpense(
  expense: Omit<Expense, 'id'>,
): string[] {
  const errors: string[] = []

  if (!expense.description.trim()) {
    errors.push('Description is required.')
  }

  if (!expense.amount || expense.amount <= 0) {
    errors.push('Amount must be greater than zero.')
  }

  if (!expense.paidById) {
    errors.push('Select who paid.')
  }

  if (expense.splitAmong.length === 0) {
    errors.push('At least one person must be in the split.')
  }

  if (expense.splitMode === 'percentage') {
    if (!validatePercentageSplit(expense.splitDetails)) {
      errors.push('Percentages must add up to 100%.')
    }
  } else if (expense.splitMode === 'exact') {
    if (!validateExactSplit(expense.splitDetails, expense.amount)) {
      errors.push(`Exact amounts must add up to ${expense.amount.toFixed(2)}.`)
    }
  }

  return errors
}
