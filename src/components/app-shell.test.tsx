import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppShell } from './app-shell'
import type { AppState } from '@/types'

// Mock useAppState to control what step is rendered
vi.mock('@/hooks/use-app-state', () => ({
  useAppState: vi.fn(),
}))

// Mock useTheme so ThemeToggle works without a real ThemeProvider
vi.mock('@/hooks/use-theme', () => ({
  useTheme: vi.fn(() => ({
    theme: 'system' as const,
    resolvedTheme: 'light' as const,
    setTheme: vi.fn(),
  })),
}))

import { useAppState } from '@/hooks/use-app-state'

function setupState(currentStep: number) {
  const state: AppState = {
    participants: [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
    expenses: [{
      id: 'e1', description: 'Gift', amount: 50,
      paidById: 'p1', splitMode: 'equal', splitAmong: ['p1', 'p2'], splitDetails: [],
    }],
    currencySymbol: '€',
    currentStep,
  }
  vi.mocked(useAppState).mockReturnValue({ state, dispatch: vi.fn() })
}

describe('AppShell', () => {
  beforeEach(() => {
    // Minimal canvas mock for flow diagram in settlement step
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

  describe('header', () => {
    it('renders "Chill Bill" in header', () => {
      setupState(0)
      render(<AppShell />)
      expect(screen.getByText('Chill Bill')).toBeInTheDocument()
    })

    it('renders theme toggle button', () => {
      setupState(0)
      render(<AppShell />)
      expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument()
    })
  })

  describe('step routing', () => {
    it('renders ParticipantStep when currentStep is 0', () => {
      setupState(0)
      render(<AppShell />)
      // ParticipantStep has a unique "Next: Add Expenses" button
      expect(screen.getByRole('button', { name: /next: add expenses/i })).toBeInTheDocument()
    })

    it('renders ExpenseStep when currentStep is 1', () => {
      setupState(1)
      render(<AppShell />)
      // ExpenseStep has a unique "Calculate Settlement" button
      expect(screen.getByRole('button', { name: /calculate settlement/i })).toBeInTheDocument()
    })

    it('renders SettlementStep when currentStep is 2', () => {
      setupState(2)
      render(<AppShell />)
      // SettlementStep has a unique "Start New" button
      expect(screen.getByRole('button', { name: /start new/i })).toBeInTheDocument()
    })

    it('does not render ExpenseStep when currentStep is 0', () => {
      setupState(0)
      render(<AppShell />)
      expect(screen.queryByRole('button', { name: /calculate settlement/i })).not.toBeInTheDocument()
    })
  })

  describe('StepIndicator', () => {
    it('renders StepIndicator step numbers', () => {
      setupState(0)
      render(<AppShell />)
      // Numbers 1 and 2 also appear in ParticipantList index badges, so use getAllByText
      expect(screen.getAllByText('1').length).toBeGreaterThan(0)
      expect(screen.getAllByText('2').length).toBeGreaterThan(0)
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })
})
