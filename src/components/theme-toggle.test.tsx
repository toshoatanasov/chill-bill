import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './theme-toggle'
import { ThemeProvider } from '@/context/theme-context'
import { TooltipProvider } from '@/components/ui/tooltip'

function renderToggle(initialTheme?: string) {
  if (initialTheme) localStorage.setItem('bill-split-theme', initialTheme)
  render(
    <ThemeProvider>
      <TooltipProvider>
        <ThemeToggle />
      </TooltipProvider>
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  describe('icon display', () => {
    it('renders Sun icon when theme is light', () => {
      renderToggle('light')
      // lucide Sun icon rendered inside the button
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByLabelText('Theme: Light')).toBeInTheDocument()
    })

    it('renders Moon icon when theme is dark', () => {
      renderToggle('dark')
      expect(screen.getByLabelText('Theme: Dark')).toBeInTheDocument()
    })

    it('renders Monitor icon when theme is system', () => {
      renderToggle('system')
      expect(screen.getByLabelText('Theme: System')).toBeInTheDocument()
    })
  })

  describe('cycling behavior', () => {
    it('switches from light to dark on click', async () => {
      const user = userEvent.setup()
      renderToggle('light')
      await user.click(screen.getByRole('button'))
      expect(screen.getByLabelText('Theme: Dark')).toBeInTheDocument()
    })

    it('switches from dark to system on click', async () => {
      const user = userEvent.setup()
      renderToggle('dark')
      await user.click(screen.getByRole('button'))
      expect(screen.getByLabelText('Theme: System')).toBeInTheDocument()
    })

    it('switches from system to light on click', async () => {
      const user = userEvent.setup()
      renderToggle('system')
      await user.click(screen.getByRole('button'))
      expect(screen.getByLabelText('Theme: Light')).toBeInTheDocument()
    })
  })
})
