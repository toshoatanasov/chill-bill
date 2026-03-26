import { useReducer } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SplitConfig } from './split-config'
import { validateExpense } from '@/lib/validation'
import type { Expense, Participant, SplitDetail, SplitMode } from '@/types'

interface ExpenseFormProps {
  participants: Participant[]
  editingExpense?: Expense | null
  onSubmit: (expense: Omit<Expense, 'id'>) => void
  onCancel?: () => void
}

function getDefaultSplitDetails(participants: Participant[], mode: SplitMode): SplitDetail[] {
  if (mode === 'percentage') {
    const perPerson = participants.length > 0 ? 100 / participants.length : 0
    return participants.map((p) => ({ participantId: p.id, value: Math.round(perPerson * 100) / 100 }))
  }
  return participants.map((p) => ({ participantId: p.id, value: 0 }))
}

interface FormState {
  description: string
  amount: string
  paidById: string
  splitMode: SplitMode
  splitAmong: string[]
  splitDetails: SplitDetail[]
  errors: string[]
}

type FormAction =
  | { type: 'SET_DESCRIPTION'; value: string }
  | { type: 'SET_AMOUNT'; value: string }
  | { type: 'SET_PAID_BY'; value: string }
  | { type: 'SET_SPLIT_MODE'; mode: SplitMode; participants: Participant[] }
  | { type: 'SET_SPLIT_AMONG'; ids: string[] }
  | { type: 'SET_SPLIT_DETAILS'; details: SplitDetail[] }
  | { type: 'SET_ERRORS'; errors: string[] }
  | { type: 'RESET'; participants: Participant[] }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_DESCRIPTION':
      return { ...state, description: action.value, errors: [] }
    case 'SET_AMOUNT':
      return { ...state, amount: action.value, errors: [] }
    case 'SET_PAID_BY':
      return { ...state, paidById: action.value, errors: [] }
    case 'SET_SPLIT_MODE':
      return {
        ...state,
        splitMode: action.mode,
        splitDetails: action.mode === 'equal' ? [] : getDefaultSplitDetails(action.participants, action.mode),
        errors: [],
      }
    case 'SET_SPLIT_AMONG':
      return { ...state, splitAmong: action.ids }
    case 'SET_SPLIT_DETAILS':
      return { ...state, splitDetails: action.details }
    case 'SET_ERRORS':
      return { ...state, errors: action.errors }
    case 'RESET':
      return createInitialState(null, action.participants)
    default:
      return state
  }
}

function createInitialState(editingExpense: Expense | null | undefined, participants: Participant[]): FormState {
  return {
    description: editingExpense?.description ?? '',
    amount: editingExpense?.amount?.toString() ?? '',
    paidById: editingExpense?.paidById ?? '',
    splitMode: editingExpense?.splitMode ?? 'equal',
    splitAmong: editingExpense?.splitAmong ?? participants.map((p) => p.id),
    splitDetails: editingExpense?.splitDetails ?? getDefaultSplitDetails(participants, editingExpense?.splitMode ?? 'equal'),
    errors: [],
  }
}

export function ExpenseForm({ participants, editingExpense, onSubmit, onCancel }: ExpenseFormProps) {
  const [form, formDispatch] = useReducer(
    formReducer,
    { editingExpense, participants },
    ({ editingExpense, participants }) => createInitialState(editingExpense, participants),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(form.amount)
    const expense: Omit<Expense, 'id'> = {
      description: form.description.trim(),
      amount: parsedAmount,
      paidById: form.paidById,
      splitMode: form.splitMode,
      splitAmong: form.splitAmong,
      splitDetails: form.splitMode === 'equal' ? [] : form.splitDetails.filter((d) => form.splitAmong.includes(d.participantId)),
    }

    const validationErrors = validateExpense(expense)
    if (validationErrors.length > 0) {
      formDispatch({ type: 'SET_ERRORS', errors: validationErrors })
      return
    }

    onSubmit(expense)

    if (!editingExpense) {
      formDispatch({ type: 'RESET', participants })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {form.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {form.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="e.g. Birthday gift"
            value={form.description}
            onChange={(e) => formDispatch({ type: 'SET_DESCRIPTION', value: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => formDispatch({ type: 'SET_AMOUNT', value: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Paid by</Label>
        <Select value={form.paidById} onValueChange={(v) => formDispatch({ type: 'SET_PAID_BY', value: v ?? '' })}>
          <SelectTrigger>
            <SelectValue placeholder="Select who paid">
              {form.paidById
                ? (participants.find((p) => p.id === form.paidById)?.name ?? 'Select who paid')
                : 'Select who paid'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {participants.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Split mode</Label>
        <Tabs value={form.splitMode} onValueChange={(v) => formDispatch({ type: 'SET_SPLIT_MODE', mode: v as SplitMode, participants })}>
          <TabsList className="w-full">
            <TabsTrigger value="equal" className="flex-1">Equal</TabsTrigger>
            <TabsTrigger value="percentage" className="flex-1">Percentage</TabsTrigger>
            <TabsTrigger value="exact" className="flex-1">Exact</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <SplitConfig
        participants={participants}
        splitMode={form.splitMode}
        splitAmong={form.splitAmong}
        splitDetails={form.splitDetails}
        totalAmount={parseFloat(form.amount) || 0}
        onSplitAmongChange={(ids) => formDispatch({ type: 'SET_SPLIT_AMONG', ids })}
        onSplitDetailsChange={(details) => formDispatch({ type: 'SET_SPLIT_DETAILS', details })}
      />

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">
          {editingExpense ? 'Save Changes' : 'Add Expense'}
        </Button>
      </div>
    </form>
  )
}
