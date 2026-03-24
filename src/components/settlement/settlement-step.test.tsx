import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettlementStep } from './settlement-step'
import type { AppAction, AppState } from '@/types'

// Minimal canvas mock for FlowDiagram inside SettlementStep
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillStyle: '', strokeStyle: '', lineWidth: 0, font: '', textAlign: 'center',
    fillRect: vi.fn(), fillText: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(),
    lineTo: vi.fn(), bezierCurveTo: vi.fn(), stroke: vi.fn(), fill: vi.fn(),
    scale: vi.fn(), closePath: vi.fn(), quadraticCurveTo: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([128, 128, 128, 255]) })),
  }) as unknown as CanvasRenderingContext2D)
  HTMLCanvasElement.prototype.toBlob = vi.fn()
  Object.defineProperty(window, 'getComputedStyle', {
    value: vi.fn(() => ({ getPropertyValue: vi.fn(() => '0.2 0 0') })),
    configurable: true,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    participants: [
      { id: 'alice', name: 'Alice' },
      { id: 'bob', name: 'Bob' },
    ],
    expenses: [{
      id: 'e1', description: 'Gift', amount: 50,
      paidById: 'alice', splitMode: 'equal', splitAmong: ['alice', 'bob'], splitDetails: [],
    }],
    currencySymbol: '€',
    currentStep: 2,
    ...overrides,
  }
}

describe('SettlementStep', () => {
  describe('summary stats', () => {
    it('shows participant count', () => {
      render(<SettlementStep state={makeState()} dispatch={vi.fn()} />)
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('shows expense count', () => {
      render(<SettlementStep state={makeState()} dispatch={vi.fn()} />)
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('shows total amount', () => {
      render(<SettlementStep state={makeState()} dispatch={vi.fn()} />)
      expect(screen.getByText('50.00 €')).toBeInTheDocument()
    })
  })

  describe('transaction section', () => {
    it('shows "transfers needed" heading when there are transactions', () => {
      render(<SettlementStep state={makeState()} dispatch={vi.fn()} />)
      expect(screen.getByText(/transfer.*needed/i)).toBeInTheDocument()
    })

    it('shows "Settlement" heading when no transactions needed', () => {
      // Both pay equally → no transactions
      const state = makeState({
        expenses: [
          { id: 'e1', description: 'A', amount: 50, paidById: 'alice', splitMode: 'equal', splitAmong: ['alice', 'bob'], splitDetails: [] },
          { id: 'e2', description: 'B', amount: 50, paidById: 'bob', splitMode: 'equal', splitAmong: ['alice', 'bob'], splitDetails: [] },
        ],
      })
      render(<SettlementStep state={state} dispatch={vi.fn()} />)
      // Both the CardTitle and the section h3 contain 'Settlement' when no transactions
      expect(screen.getAllByText('Settlement').length).toBeGreaterThan(0)
    })
  })

  describe('text summary', () => {
    it('is not rendered when no transactions', () => {
      const state = makeState({ expenses: [] })
      render(<SettlementStep state={state} dispatch={vi.fn()} />)
      expect(screen.queryByText('Text summary')).not.toBeInTheDocument()
    })

    it('shows text summary with correct format', () => {
      render(<SettlementStep state={makeState()} dispatch={vi.fn()} />)
      expect(screen.getByText('Text summary')).toBeInTheDocument()
      // Bob owes Alice 25 €
      expect(screen.getByText(/Bob → Alice: 25\.00 €/)).toBeInTheDocument()
    })

    it('copy button calls clipboard.writeText', async () => {
      const user = userEvent.setup()
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

      render(<SettlementStep state={makeState()} dispatch={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /^copy$/i }))
      expect(writeText).toHaveBeenCalledWith('Bob → Alice: 25.00 €')
    })

    it('shows "Copied!" feedback and reverts after 2 seconds', async () => {
      vi.useFakeTimers()
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
      })

      render(<SettlementStep state={makeState()} dispatch={vi.fn()} />)
      // Wrap click + microtask flush in a single async act so React processes
      // the state update (setTextCopied(true)) within the act context
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^copy$/i }))
        // Flush the resolved clipboard.writeText promise chain (microtasks)
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(screen.getByText('Copied!')).toBeInTheDocument()

      act(() => vi.advanceTimersByTime(2000))
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('dispatches SET_STEP 1 on Back click', async () => {
      const user = userEvent.setup()
      const dispatch = vi.fn<[AppAction], void>()
      render(<SettlementStep state={makeState()} dispatch={dispatch} />)
      await user.click(screen.getByRole('button', { name: /back/i }))
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_STEP', step: 1 })
    })
  })

  describe('Start New confirmation dialog', () => {
    it('opens confirm dialog when Start New is clicked', async () => {
      const user = userEvent.setup()
      render(<SettlementStep state={makeState()} dispatch={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /start new/i }))
      expect(screen.getByText(/start a new split/i)).toBeInTheDocument()
    })

    it('closes dialog when Cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<SettlementStep state={makeState()} dispatch={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /start new/i }))
      await user.click(screen.getByRole('button', { name: /^cancel$/i }))
      expect(screen.queryByText(/start a new split/i)).not.toBeInTheDocument()
    })

    it('dispatches RESET when confirmed', async () => {
      const user = userEvent.setup()
      const dispatch = vi.fn<[AppAction], void>()
      render(<SettlementStep state={makeState()} dispatch={dispatch} />)
      await user.click(screen.getByRole('button', { name: /start new/i }))
      await user.click(screen.getByRole('button', { name: /yes, start new/i }))
      expect(dispatch).toHaveBeenCalledWith({ type: 'RESET' })
    })
  })
})
