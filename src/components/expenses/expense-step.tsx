import { Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ExpenseForm } from './expense-form'
import { ExpenseList } from './expense-list'
import type { AppAction, AppState } from '@/types'

interface ExpenseStepProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

export function ExpenseStep({ state, dispatch }: ExpenseStepProps) {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Expenses</CardTitle>
        </div>
        <CardDescription>
          Add all expenses and how they should be split.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <ExpenseForm
          participants={state.participants}
          onSubmit={(expense) => dispatch({ type: 'ADD_EXPENSE', expense })}
        />

        <Separator />

        <ExpenseList state={state} dispatch={dispatch} />
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => dispatch({ type: 'SET_STEP', step: 'participants' })}
        >
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={state.expenses.length === 0}
          onClick={() => dispatch({ type: 'SET_STEP', step: 'settlement' })}
        >
          Calculate Settlement
        </Button>
      </CardFooter>
    </Card>
  )
}
