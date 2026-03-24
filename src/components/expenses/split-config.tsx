import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Participant, SplitDetail, SplitMode } from '@/types'

interface SplitConfigProps {
  participants: Participant[]
  splitMode: SplitMode
  splitAmong: string[]
  splitDetails: SplitDetail[]
  totalAmount: number
  onSplitAmongChange: (ids: string[]) => void
  onSplitDetailsChange: (details: SplitDetail[]) => void
}

export function SplitConfig({
  participants,
  splitMode,
  splitAmong,
  splitDetails,
  totalAmount,
  onSplitAmongChange,
  onSplitDetailsChange,
}: SplitConfigProps) {
  const toggleParticipant = (id: string, checked: boolean) => {
    if (checked) {
      onSplitAmongChange([...splitAmong, id])
    } else {
      onSplitAmongChange(splitAmong.filter((pid) => pid !== id))
    }
  }

  const updateDetail = (participantId: string, value: number) => {
    const existing = splitDetails.find((d) => d.participantId === participantId)
    if (existing) {
      onSplitDetailsChange(
        splitDetails.map((d) => (d.participantId === participantId ? { ...d, value } : d)),
      )
    } else {
      onSplitDetailsChange([...splitDetails, { participantId, value }])
    }
  }

  const getDetailValue = (id: string): number => {
    return splitDetails.find((d) => d.participantId === id)?.value ?? 0
  }

  if (splitMode === 'equal') {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Split equally among:</p>
        <div className="space-y-2">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <Checkbox
                id={`equal-${p.id}`}
                checked={splitAmong.includes(p.id)}
                onCheckedChange={(checked) => toggleParticipant(p.id, !!checked)}
              />
              <Label htmlFor={`equal-${p.id}`} className="cursor-pointer font-normal">
                {p.name}
              </Label>
              {splitAmong.includes(p.id) && splitAmong.length > 0 && totalAmount > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {(totalAmount / splitAmong.length).toFixed(2)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (splitMode === 'percentage') {
    const total = splitDetails.reduce((s, d) => s + d.value, 0)
    const remaining = Math.round((100 - total) * 100) / 100

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Enter percentages (must total 100%):</p>
          <span
            className={`text-xs font-medium ${Math.abs(remaining) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
          >
            {remaining === 0 ? '✓ 100%' : `Remaining: ${remaining.toFixed(1)}%`}
          </span>
        </div>
        <div className="space-y-2">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="w-24 truncate text-sm">{p.name}</span>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={getDetailValue(p.id) || ''}
                onChange={(e) => updateDetail(p.id, parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">%</span>
              {totalAmount > 0 && getDetailValue(p.id) > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {((totalAmount * getDetailValue(p.id)) / 100).toFixed(2)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // exact mode
  const exactTotal = splitDetails.reduce((s, d) => s + d.value, 0)
  const exactRemaining = Math.round((totalAmount - exactTotal) * 100) / 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Enter exact amounts:</p>
        <span
          className={`text-xs font-medium ${Math.abs(exactRemaining) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
        >
          {Math.abs(exactRemaining) < 0.01
            ? '✓ Balanced'
            : `Remaining: ${exactRemaining.toFixed(2)}`}
        </span>
      </div>
      <div className="space-y-2">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <span className="w-24 truncate text-sm">{p.name}</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={getDetailValue(p.id) || ''}
              onChange={(e) => updateDetail(p.id, parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-24"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
