import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SplitConfig } from './split-config'
import type { Participant, SplitDetail } from '@/types'

const participants: Participant[] = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Charlie' },
]

function defaultProps(overrides = {}) {
  return {
    participants,
    splitMode: 'equal' as const,
    splitAmong: ['p1', 'p2', 'p3'],
    splitDetails: [] as SplitDetail[],
    totalAmount: 90,
    onSplitAmongChange: vi.fn(),
    onSplitDetailsChange: vi.fn(),
    ...overrides,
  }
}

describe('SplitConfig', () => {
  describe('equal mode', () => {
    it('renders a checkbox for each participant', () => {
      render(<SplitConfig {...defaultProps()} />)
      expect(screen.getByRole('checkbox', { hidden: true, name: 'Alice' })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { hidden: true, name: 'Bob' })).toBeInTheDocument()
    })

    it('shows per-person share when totalAmount > 0 and participant is checked', () => {
      render(<SplitConfig {...defaultProps()} />)
      // 90 / 3 = 30
      expect(screen.getAllByText('30.00')).toHaveLength(3)
    })

    it('does not show share when totalAmount is 0', () => {
      render(<SplitConfig {...defaultProps({ totalAmount: 0 })} />)
      expect(screen.queryByText('30.00')).not.toBeInTheDocument()
    })

    it('calls onSplitAmongChange with participant added when checked', async () => {
      const user = userEvent.setup()
      const onSplitAmongChange = vi.fn()
      render(<SplitConfig {...defaultProps({ splitAmong: ['p1', 'p2'], onSplitAmongChange })} />)
      // Charlie is unchecked
      const label = screen.getByText('Charlie')
      await user.click(label)
      expect(onSplitAmongChange).toHaveBeenCalledWith(['p1', 'p2', 'p3'])
    })

    it('calls onSplitAmongChange with participant removed when unchecked', async () => {
      const user = userEvent.setup()
      const onSplitAmongChange = vi.fn()
      render(<SplitConfig {...defaultProps({ onSplitAmongChange })} />)
      await user.click(screen.getByText('Alice'))
      expect(onSplitAmongChange).toHaveBeenCalledWith(['p2', 'p3'])
    })
  })

  describe('percentage mode', () => {
    it('renders a number input for each participant', () => {
      render(<SplitConfig {...defaultProps({ splitMode: 'percentage', splitDetails: [] })} />)
      expect(screen.getAllByRole('spinbutton')).toHaveLength(3)
    })

    it('shows remaining % when total is not 100', () => {
      render(<SplitConfig {...defaultProps({ splitMode: 'percentage', splitDetails: [{ participantId: 'p1', value: 40 }] })} />)
      expect(screen.getByText(/remaining/i)).toBeInTheDocument()
    })

    it('shows ✓ 100% when percentages sum to 100', () => {
      const details: SplitDetail[] = [
        { participantId: 'p1', value: 50 },
        { participantId: 'p2', value: 30 },
        { participantId: 'p3', value: 20 },
      ]
      render(<SplitConfig {...defaultProps({ splitMode: 'percentage', splitDetails: details })} />)
      expect(screen.getByText('✓ 100%')).toBeInTheDocument()
    })

    it('calls onSplitDetailsChange on input change', async () => {
      const user = userEvent.setup()
      const onSplitDetailsChange = vi.fn()
      render(<SplitConfig {...defaultProps({ splitMode: 'percentage', splitDetails: [], onSplitDetailsChange })} />)
      const inputs = screen.getAllByRole('spinbutton')
      await user.type(inputs[0], '50')
      expect(onSplitDetailsChange).toHaveBeenCalled()
    })
  })

  describe('exact mode', () => {
    it('renders a number input for each participant', () => {
      render(<SplitConfig {...defaultProps({ splitMode: 'exact', splitDetails: [] })} />)
      expect(screen.getAllByRole('spinbutton')).toHaveLength(3)
    })

    it('shows remaining amount when sum does not match total', () => {
      render(<SplitConfig {...defaultProps({ splitMode: 'exact', splitDetails: [{ participantId: 'p1', value: 40 }] })} />)
      expect(screen.getByText(/remaining/i)).toBeInTheDocument()
    })

    it('shows ✓ Balanced when exact amounts sum to totalAmount', () => {
      const details: SplitDetail[] = [
        { participantId: 'p1', value: 30 },
        { participantId: 'p2', value: 30 },
        { participantId: 'p3', value: 30 },
      ]
      render(<SplitConfig {...defaultProps({ splitMode: 'exact', splitDetails: details })} />)
      expect(screen.getByText('✓ Balanced')).toBeInTheDocument()
    })

    it('calls onSplitDetailsChange on input change', async () => {
      const user = userEvent.setup()
      const onSplitDetailsChange = vi.fn()
      render(<SplitConfig {...defaultProps({ splitMode: 'exact', splitDetails: [], onSplitDetailsChange })} />)
      const inputs = screen.getAllByRole('spinbutton')
      await user.type(inputs[1], '30')
      expect(onSplitDetailsChange).toHaveBeenCalled()
    })
  })
})
