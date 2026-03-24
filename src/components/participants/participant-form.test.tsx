import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParticipantForm } from './participant-form'
import type { Participant } from '@/types'

const noParticipants: Participant[] = []
const withAlice: Participant[] = [{ id: '1', name: 'Alice' }]

describe('ParticipantForm', () => {
  describe('rendering', () => {
    it('renders an input with label "Add participant"', () => {
      render(<ParticipantForm participants={noParticipants} onAdd={vi.fn()} />)
      expect(screen.getByLabelText(/add participant/i)).toBeInTheDocument()
    })

    it('renders an Add button', () => {
      render(<ParticipantForm participants={noParticipants} onAdd={vi.fn()} />)
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
    })

    it('renders no error initially', () => {
      render(<ParticipantForm participants={noParticipants} onAdd={vi.fn()} />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('validation — empty name', () => {
    it('shows error on empty submit', async () => {
      const user = userEvent.setup()
      render(<ParticipantForm participants={noParticipants} onAdd={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /add/i }))
      expect(screen.getByText('Name cannot be empty.')).toBeInTheDocument()
    })

    it('does not call onAdd when name is empty', async () => {
      const user = userEvent.setup()
      const onAdd = vi.fn()
      render(<ParticipantForm participants={noParticipants} onAdd={onAdd} />)
      await user.click(screen.getByRole('button', { name: /add/i }))
      expect(onAdd).not.toHaveBeenCalled()
    })

    it('clears the error when user starts typing', async () => {
      const user = userEvent.setup()
      render(<ParticipantForm participants={noParticipants} onAdd={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /add/i }))
      expect(screen.getByText('Name cannot be empty.')).toBeInTheDocument()
      await user.type(screen.getByRole('textbox'), 'B')
      expect(screen.queryByText('Name cannot be empty.')).not.toBeInTheDocument()
    })
  })

  describe('validation — duplicate name', () => {
    it('shows error for exact duplicate', async () => {
      const user = userEvent.setup()
      render(<ParticipantForm participants={withAlice} onAdd={vi.fn()} />)
      await user.type(screen.getByRole('textbox'), 'Alice')
      await user.click(screen.getByRole('button', { name: /add/i }))
      expect(screen.getByText('A participant with this name already exists.')).toBeInTheDocument()
    })

    it('is case-insensitive', async () => {
      const user = userEvent.setup()
      render(<ParticipantForm participants={withAlice} onAdd={vi.fn()} />)
      await user.type(screen.getByRole('textbox'), 'ALICE')
      await user.click(screen.getByRole('button', { name: /add/i }))
      expect(screen.getByText('A participant with this name already exists.')).toBeInTheDocument()
    })

    it('does not call onAdd for duplicates', async () => {
      const user = userEvent.setup()
      const onAdd = vi.fn()
      render(<ParticipantForm participants={withAlice} onAdd={onAdd} />)
      await user.type(screen.getByRole('textbox'), 'Alice')
      await user.click(screen.getByRole('button', { name: /add/i }))
      expect(onAdd).not.toHaveBeenCalled()
    })
  })

  describe('successful submission', () => {
    it('calls onAdd with the trimmed name', async () => {
      const user = userEvent.setup()
      const onAdd = vi.fn()
      render(<ParticipantForm participants={noParticipants} onAdd={onAdd} />)
      await user.type(screen.getByRole('textbox'), '  Bob  ')
      await user.click(screen.getByRole('button', { name: /add/i }))
      expect(onAdd).toHaveBeenCalledWith('Bob')
    })

    it('clears the input after successful submit', async () => {
      const user = userEvent.setup()
      render(<ParticipantForm participants={noParticipants} onAdd={vi.fn()} />)
      const input = screen.getByRole('textbox')
      await user.type(input, 'Bob')
      await user.click(screen.getByRole('button', { name: /add/i }))
      expect(input).toHaveValue('')
    })

    it('shows no error after successful submit', async () => {
      const user = userEvent.setup()
      render(<ParticipantForm participants={noParticipants} onAdd={vi.fn()} />)
      await user.type(screen.getByRole('textbox'), 'Bob')
      await user.click(screen.getByRole('button', { name: /add/i }))
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
