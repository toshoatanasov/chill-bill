import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Participant } from '@/types'

interface ParticipantListProps {
  participants: Participant[]
  onRemove: (id: string) => void
}

export function ParticipantList({ participants, onRemove }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No participants yet. Add at least 2 to continue.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {participants.map((p, index) => (
        <li
          key={p.id}
          className="flex items-center justify-between rounded-md border border-foreground/5 bg-card/50 backdrop-blur-sm px-3 py-2 transition-all hover:bg-card/80 hover:shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#863bff] to-[#47bfff] text-white text-xs font-medium shadow-sm shadow-purple-500/20">
              {index + 1}
            </span>
            <span className="text-sm font-medium">{p.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(p.id)}
            aria-label={`Remove ${p.name}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  )
}
