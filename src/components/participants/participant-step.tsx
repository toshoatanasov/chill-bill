import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ParticipantForm } from './participant-form'
import { ParticipantList } from './participant-list'
import type { AppAction, AppState } from '@/types'

interface ParticipantStepProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

export function ParticipantStep({ state, dispatch }: ParticipantStepProps) {
  const { participants } = state
  const canProceed = participants.length >= 2

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Participants</CardTitle>
        </div>
        <CardDescription>
          Add everyone who will be part of this bill split.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <ParticipantForm
          participants={participants}
          onAdd={(name) => dispatch({ type: 'ADD_PARTICIPANT', name })}
        />
        <ParticipantList
          participants={participants}
          onRemove={(id) => dispatch({ type: 'REMOVE_PARTICIPANT', id })}
        />
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {!canProceed && participants.length > 0 && (
          <p className="text-xs text-muted-foreground">Add at least one more participant.</p>
        )}
        <Button
          className="w-full"
          disabled={!canProceed}
          onClick={() => dispatch({ type: 'SET_STEP', step: 1 })}
        >
          Next: Add Expenses
        </Button>
      </CardFooter>
    </Card>
  )
}
