import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParticipantStep } from './participant-step'
import type { AppAction, AppState } from '@/types'

function makeState(participantNames: string[]): AppState {
  return {
    participants: participantNames.map((name, i) => ({ id: `p${i}`, name })),
    expenses: [],
    currencySymbol: '€',
    currentStep: 0,
  }
}

describe('ParticipantStep', () => {
  describe('rendering', () => {
    it('renders the Participants card title', () => {
      render(<ParticipantStep state={makeState([])} dispatch={vi.fn()} />)
      expect(screen.getByText('Participants')).toBeInTheDocument()
    })
  })

  describe('Next button state', () => {
    it('is disabled with 0 participants', () => {
      render(<ParticipantStep state={makeState([])} dispatch={vi.fn()} />)
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
    })

    it('is disabled with 1 participant', () => {
      render(<ParticipantStep state={makeState(['Alice'])} dispatch={vi.fn()} />)
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
    })

    it('is enabled with 2 participants', () => {
      render(<ParticipantStep state={makeState(['Alice', 'Bob'])} dispatch={vi.fn()} />)
      expect(screen.getByRole('button', { name: /next/i })).toBeEnabled()
    })
  })

  describe('hint message', () => {
    it('shows hint when exactly 1 participant', () => {
      render(<ParticipantStep state={makeState(['Alice'])} dispatch={vi.fn()} />)
      expect(screen.getByText(/add at least one more/i)).toBeInTheDocument()
    })

    it('does not show hint with 0 participants', () => {
      render(<ParticipantStep state={makeState([])} dispatch={vi.fn()} />)
      expect(screen.queryByText(/add at least one more/i)).not.toBeInTheDocument()
    })

    it('does not show hint with 2+ participants', () => {
      render(<ParticipantStep state={makeState(['Alice', 'Bob'])} dispatch={vi.fn()} />)
      expect(screen.queryByText(/add at least one more/i)).not.toBeInTheDocument()
    })
  })

  describe('Next button click', () => {
    it('dispatches SET_STEP with step=1', async () => {
      const user = userEvent.setup()
      const dispatch = vi.fn<(a: AppAction) => void>()
      render(<ParticipantStep state={makeState(['Alice', 'Bob'])} dispatch={dispatch} />)
      await user.click(screen.getByRole('button', { name: /next/i }))
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_STEP', step: 1 })
    })
  })

  describe('participant management', () => {
    it('dispatches ADD_PARTICIPANT when form is submitted', async () => {
      const user = userEvent.setup()
      const dispatch = vi.fn<(a: AppAction) => void>()
      render(<ParticipantStep state={makeState([])} dispatch={dispatch} />)
      await user.type(screen.getByRole('textbox'), 'Alice')
      await user.click(screen.getByRole('button', { name: /^add$/i }))
      expect(dispatch).toHaveBeenCalledWith({ type: 'ADD_PARTICIPANT', name: 'Alice' })
    })

    it('dispatches REMOVE_PARTICIPANT when remove button is clicked', async () => {
      const user = userEvent.setup()
      const dispatch = vi.fn<(a: AppAction) => void>()
      render(<ParticipantStep state={makeState(['Alice', 'Bob'])} dispatch={dispatch} />)
      await user.click(screen.getByRole('button', { name: 'Remove Alice' }))
      expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_PARTICIPANT', id: 'p0' })
    })
  })
})
