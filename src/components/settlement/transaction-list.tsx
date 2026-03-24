import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { Participant, Transaction } from '@/types'

interface TransactionListProps {
  transactions: Transaction[]
  participants: Participant[]
  currencySymbol: string
}

export function TransactionList({ transactions, participants, currencySymbol }: TransactionListProps) {
  const getName = (id: string) => participants.find((p) => p.id === id)?.name ?? 'Unknown'

  if (transactions.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Everyone is settled up! No transactions needed.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((t, i) => (
        <Card key={i} className="py-0">
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <span className="font-medium text-sm">{getName(t.fromId)}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm">{getName(t.toId)}</span>
            <span className="ml-auto font-semibold text-sm">
              {formatCurrency(t.amount, currencySymbol)}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
