import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Participant } from '@/types'

interface ParticipantFormProps {
  participants: Participant[]
  onAdd: (name: string) => void
}

export function ParticipantForm({ participants, onAdd }: ParticipantFormProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name cannot be empty.')
      return
    }
    if (participants.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A participant with this name already exists.')
      return
    }
    onAdd(trimmed)
    setName('')
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Label htmlFor="participant-name">Add participant</Label>
      <div className="flex gap-2">
        <Input
          id="participant-name"
          placeholder="e.g. Alice"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          className="flex-1"
        />
        <Button type="submit">Add</Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
