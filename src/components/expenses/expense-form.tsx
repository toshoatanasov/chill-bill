import { useEffect, useState } from 'react'
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

export function ExpenseForm({ participants, editingExpense, onSubmit, onCancel }: ExpenseFormProps) {
  const [description, setDescription] = useState(editingExpense?.description ?? '')
  const [amount, setAmount] = useState(editingExpense?.amount?.toString() ?? '')
  const [paidById, setPaidById] = useState(editingExpense?.paidById ?? '')
  const [splitMode, setSplitMode] = useState<SplitMode>(editingExpense?.splitMode ?? 'equal')
  const [splitAmong, setSplitAmong] = useState<string[]>(
    editingExpense?.splitAmong ?? participants.map((p) => p.id),
  )
  const [splitDetails, setSplitDetails] = useState<SplitDetail[]>(
    editingExpense?.splitDetails ?? getDefaultSplitDetails(participants, editingExpense?.splitMode ?? 'equal'),
  )
  const [errors, setErrors] = useState<string[]>([])

  // Reset split details when mode changes
  useEffect(() => {
    if (splitMode !== 'equal') {
      setSplitDetails(getDefaultSplitDetails(participants, splitMode))
    }
  }, [splitMode, participants])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)
    const expense: Omit<Expense, 'id'> = {
      description: description.trim(),
      amount: parsedAmount,
      paidById,
      splitMode,
      splitAmong,
      splitDetails: splitMode === 'equal' ? [] : splitDetails.filter((d) => splitAmong.includes(d.participantId)),
    }

    const validationErrors = validateExpense(expense)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    onSubmit(expense)

    if (!editingExpense) {
      setDescription('')
      setAmount('')
      setPaidById('')
      setSplitMode('equal')
      setSplitAmong(participants.map((p) => p.id))
      setSplitDetails(getDefaultSplitDetails(participants, 'equal'))
      setErrors([])
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
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
            value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors([]) }}
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
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors([]) }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Paid by</Label>
        <Select value={paidById} onValueChange={(v) => setPaidById(v ?? '')}>
          <SelectTrigger>
            <SelectValue placeholder="Select who paid">
              {paidById
                ? (participants.find((p) => p.id === paidById)?.name ?? 'Select who paid')
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
        <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as SplitMode)}>
          <TabsList className="w-full">
            <TabsTrigger value="equal" className="flex-1">Equal</TabsTrigger>
            <TabsTrigger value="percentage" className="flex-1">Percentage</TabsTrigger>
            <TabsTrigger value="exact" className="flex-1">Exact</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <SplitConfig
        participants={participants}
        splitMode={splitMode}
        splitAmong={splitAmong}
        splitDetails={splitDetails}
        totalAmount={parseFloat(amount) || 0}
        onSplitAmongChange={setSplitAmong}
        onSplitDetailsChange={setSplitDetails}
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
