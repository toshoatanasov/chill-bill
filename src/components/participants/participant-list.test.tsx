import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParticipantList } from './participant-list'
import type { Participant } from '@/types'

const participants: Participant[] = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Charlie' },
]

describe('ParticipantList', () => {
  describe('empty state', () => {
    it('shows empty state message', () => {
      render(<ParticipantList participants={[]} onRemove={vi.fn()} />)
      expect(screen.getByText(/no participants yet/i)).toBeInTheDocument()
    })
  })

  describe('with participants', () => {
    it('renders one item per participant', () => {
      render(<ParticipantList participants={participants} onRemove={vi.fn()} />)
      expect(screen.getAllByRole('listitem')).toHaveLength(3)
    })

    it('displays participant names', () => {
      render(<ParticipantList participants={participants} onRemove={vi.fn()} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()
    })

    it('displays sequential numbering', () => {
      render(<ParticipantList participants={participants} onRemove={vi.fn()} />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('renders remove button with correct aria-label', () => {
      render(<ParticipantList participants={participants} onRemove={vi.fn()} />)
      expect(screen.getByRole('button', { name: 'Remove Alice' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Remove Bob' })).toBeInTheDocument()
    })
  })

  describe('remove interaction', () => {
    it('calls onRemove with correct id', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()
      render(<ParticipantList participants={participants} onRemove={onRemove} />)
      await user.click(screen.getByRole('button', { name: 'Remove Bob' }))
      expect(onRemove).toHaveBeenCalledWith('p2')
    })

    it('calls onRemove for the correct participant when multiple exist', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()
      render(<ParticipantList participants={participants} onRemove={onRemove} />)
      await user.click(screen.getByRole('button', { name: 'Remove Charlie' }))
      expect(onRemove).toHaveBeenCalledWith('p3')
      expect(onRemove).not.toHaveBeenCalledWith('p1')
    })
  })
})
