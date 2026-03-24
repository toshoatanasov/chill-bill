import type { Expense, Participant, Transaction } from '@/types'

function computeShares(expense: Expense): Map<string, number> {
  const shares = new Map<string, number>()
  const { splitMode, splitAmong, splitDetails, amount } = expense

  if (splitMode === 'equal') {
    const perPerson = amount / splitAmong.length
    for (const pid of splitAmong) {
      shares.set(pid, perPerson)
    }
  } else if (splitMode === 'percentage') {
    for (const detail of splitDetails) {
      shares.set(detail.participantId, amount * (detail.value / 100))
    }
  } else {
    // exact
    for (const detail of splitDetails) {
      shares.set(detail.participantId, detail.value)
    }
  }

  return shares
}

export function computeSettlement(
  participants: Participant[],
  expenses: Expense[],
): Transaction[] {
  const balances = new Map<string, number>()
  for (const p of participants) {
    balances.set(p.id, 0)
  }

  for (const expense of expenses) {
    // Credit the payer
    balances.set(expense.paidById, (balances.get(expense.paidById) ?? 0) + expense.amount)

    // Debit each person's share
    const shares = computeShares(expense)
    for (const [pid, share] of shares) {
      balances.set(pid, (balances.get(pid) ?? 0) - share)
    }
  }

  const creditors: Array<{ id: string; amount: number }> = []
  const debtors: Array<{ id: string; amount: number }> = []

  for (const [id, balance] of balances) {
    const rounded = Math.round(balance * 100) / 100
    if (rounded > 0.005) creditors.push({ id, amount: rounded })
    else if (rounded < -0.005) debtors.push({ id, amount: -rounded })
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const transactions: Transaction[] = []
  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const settleAmount = Math.min(creditors[ci].amount, debtors[di].amount)
    const rounded = Math.round(settleAmount * 100) / 100

    if (rounded > 0) {
      transactions.push({
        fromId: debtors[di].id,
        toId: creditors[ci].id,
        amount: rounded,
      })
    }

    creditors[ci].amount -= settleAmount
    debtors[di].amount -= settleAmount

    if (creditors[ci].amount < 0.005) ci++
    if (debtors[di].amount < 0.005) di++
  }

  return transactions
}

