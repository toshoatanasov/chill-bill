import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ExpenseForm } from './expense-form'
import { formatCurrency, getParticipantName } from '@/lib/utils'
import type { AppAction, AppState, Expense } from '@/types'

interface ExpenseListProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const MODE_LABELS = { equal: 'Equal', percentage: 'Percentage', exact: 'Exact' }

export function ExpenseList({ state, dispatch }: ExpenseListProps) {
  const { expenses, participants, currencySymbol } = state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No expenses yet. Add one above.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
        </h3>
        <span className="text-sm font-semibold">
          Total: {formatCurrency(totalAmount, currencySymbol)}
        </span>
      </div>

      <div className="space-y-2">
        {expenses.map((expense) => (
          <Card key={expense.id} className="py-0">
            <CardContent className="py-3 px-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{expense.description}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {MODE_LABELS[expense.splitMode]}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Paid by {getParticipantName(participants, expense.paidById)} · Split among{' '}
                    {expense.splitAmong.length} person{expense.splitAmong.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-semibold text-sm">
                    {formatCurrency(expense.amount, currencySymbol)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => setEditingExpense(expense)}
                    aria-label="Edit expense"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => dispatch({ type: 'REMOVE_EXPENSE', id: expense.id })}
                    aria-label="Remove expense"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              participants={participants}
              editingExpense={editingExpense}
              onSubmit={(expense) => {
                dispatch({ type: 'EDIT_EXPENSE', expense: { ...expense, id: editingExpense.id } })
                setEditingExpense(null)
              }}
              onCancel={() => setEditingExpense(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
