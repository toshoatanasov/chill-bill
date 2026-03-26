import { useMemo, useRef, useState } from 'react'
import { BarChart3, Check, ClipboardCopy, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { FlowDiagram } from './flow-diagram'
import { TransactionList } from './transaction-list'
import { computeSettlement } from '@/lib/settlement'
import { formatCurrency, getParticipantName } from '@/lib/utils'
import type { AppAction, AppState } from '@/types'

interface SettlementStepProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

export function SettlementStep({ state, dispatch }: SettlementStepProps) {
  const { participants, expenses, currencySymbol } = state
  const [showConfirm, setShowConfirm] = useState(false)
  const [textCopied, setTextCopied] = useState(false)
  const flowDiagramRef = useRef<SVGSVGElement>(null)

  const transactions = useMemo(
    () => computeSettlement(participants, expenses),
    [participants, expenses],
  )
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  const textSummary = transactions
    .map((t) => `${getParticipantName(participants, t.fromId)} → ${getParticipantName(participants, t.toId)}: ${formatCurrency(t.amount, currencySymbol)}`)
    .join('\n')

  const copyText = async () => {
    await navigator.clipboard.writeText(textSummary)
    setTextCopied(true)
    setTimeout(() => setTextCopied(false), 2000)
  }

  return (
    <>
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Settlement</CardTitle>
          </div>
          <CardDescription>
            Minimum transactions to settle all debts.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="stat-box p-3">
              <div className="text-lg font-bold text-gradient">{participants.length}</div>
              <div className="text-xs text-muted-foreground">People</div>
            </div>
            <div className="stat-box p-3">
              <div className="text-lg font-bold text-gradient">{expenses.length}</div>
              <div className="text-xs text-muted-foreground">Expenses</div>
            </div>
            <div className="stat-box p-3">
              <div className="text-lg font-bold text-gradient">{formatCurrency(totalExpenses, currencySymbol)}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>

          <Separator />

          {/* Transaction list */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              {transactions.length > 0
                ? `${transactions.length} transfer${transactions.length !== 1 ? 's' : ''} needed`
                : 'Settlement'}
            </h3>
            <TransactionList
              transactions={transactions}
              participants={participants}
              currencySymbol={currencySymbol}
            />
          </div>

          {/* Text summary with copy */}
          {transactions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Text summary</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={copyText}
                  >
                    {textCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="rounded-md border bg-muted px-4 py-3 text-sm font-mono whitespace-pre leading-relaxed">
                  {textSummary}
                </pre>
              </div>
            </>
          )}

          {/* Flow diagram */}
          {transactions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Money flow</h3>
                <FlowDiagram
                  ref={flowDiagramRef}
                  transactions={transactions}
                  participants={participants}
                  currencySymbol={currencySymbol}
                />
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => dispatch({ type: 'SET_STEP', step: 'expenses' })}
          >
            Back
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setShowConfirm(true)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Start New
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a new split?</DialogTitle>
            <DialogDescription>
              This will clear all participants and expenses. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                dispatch({ type: 'RESET' })
                setShowConfirm(false)
              }}
            >
              Yes, start new
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
