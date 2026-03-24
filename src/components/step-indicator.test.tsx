import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepIndicator } from './step-indicator'

describe('StepIndicator', () => {
  describe('labels and numbers', () => {
    it('renders all step labels', () => {
      render(<StepIndicator currentStep={0} />)
      expect(screen.getByText('Participants')).toBeInTheDocument()
      expect(screen.getByText('Expenses')).toBeInTheDocument()
      expect(screen.getByText('Settlement')).toBeInTheDocument()
    })

    it('renders step numbers 1, 2, 3', () => {
      render(<StepIndicator currentStep={0} />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('step 0 active', () => {
    it('active step label has foreground text class', () => {
      render(<StepIndicator currentStep={0} />)
      const label = screen.getByText('Participants')
      expect(label).toHaveClass('text-gradient')
    })

    it('inactive step labels have muted-foreground class', () => {
      render(<StepIndicator currentStep={0} />)
      expect(screen.getByText('Expenses')).toHaveClass('text-muted-foreground')
      expect(screen.getByText('Settlement')).toHaveClass('text-muted-foreground')
    })
  })

  describe('step 1 active', () => {
    it('step 2 label has foreground text class', () => {
      render(<StepIndicator currentStep={1} />)
      expect(screen.getByText('Expenses')).toHaveClass('text-gradient')
    })

    it('step 1 and 3 labels have muted-foreground class', () => {
      render(<StepIndicator currentStep={1} />)
      expect(screen.getByText('Participants')).toHaveClass('text-muted-foreground')
      expect(screen.getByText('Settlement')).toHaveClass('text-muted-foreground')
    })
  })

  describe('step 2 active', () => {
    it('step 3 label has foreground text class', () => {
      render(<StepIndicator currentStep={2} />)
      expect(screen.getByText('Settlement')).toHaveClass('text-gradient')
    })

    it('steps 1 and 2 labels have muted-foreground class', () => {
      render(<StepIndicator currentStep={2} />)
      expect(screen.getByText('Participants')).toHaveClass('text-muted-foreground')
      expect(screen.getByText('Expenses')).toHaveClass('text-muted-foreground')
    })
  })
})
