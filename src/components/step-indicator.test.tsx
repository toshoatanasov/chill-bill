import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepIndicator } from './step-indicator'

describe('StepIndicator', () => {
  describe('labels and numbers', () => {
    it('renders all step labels', () => {
      render(<StepIndicator currentStep="participants" />)
      expect(screen.getByText('Participants')).toBeInTheDocument()
      expect(screen.getByText('Expenses')).toBeInTheDocument()
      expect(screen.getByText('Settlement')).toBeInTheDocument()
    })

    it('renders step numbers 1, 2, 3', () => {
      render(<StepIndicator currentStep="participants" />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('step participants active', () => {
    it('active step label has foreground text class', () => {
      render(<StepIndicator currentStep="participants" />)
      const label = screen.getByText('Participants')
      expect(label).toHaveClass('text-gradient')
    })

    it('inactive step labels have muted-foreground class', () => {
      render(<StepIndicator currentStep="participants" />)
      expect(screen.getByText('Expenses')).toHaveClass('text-muted-foreground')
      expect(screen.getByText('Settlement')).toHaveClass('text-muted-foreground')
    })
  })

  describe('step expenses active', () => {
    it('step 2 label has foreground text class', () => {
      render(<StepIndicator currentStep="expenses" />)
      expect(screen.getByText('Expenses')).toHaveClass('text-gradient')
    })

    it('step 1 and 3 labels have muted-foreground class', () => {
      render(<StepIndicator currentStep="expenses" />)
      expect(screen.getByText('Participants')).toHaveClass('text-muted-foreground')
      expect(screen.getByText('Settlement')).toHaveClass('text-muted-foreground')
    })
  })

  describe('step settlement active', () => {
    it('step 3 label has foreground text class', () => {
      render(<StepIndicator currentStep="settlement" />)
      expect(screen.getByText('Settlement')).toHaveClass('text-gradient')
    })

    it('steps 1 and 2 labels have muted-foreground class', () => {
      render(<StepIndicator currentStep="settlement" />)
      expect(screen.getByText('Participants')).toHaveClass('text-muted-foreground')
      expect(screen.getByText('Expenses')).toHaveClass('text-muted-foreground')
    })
  })
})
