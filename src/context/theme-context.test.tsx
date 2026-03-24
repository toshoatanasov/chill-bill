import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useThemeContext } from './theme-context'

function ThemeConsumer() {
  const { theme, resolvedTheme, setTheme } = useThemeContext()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>set light</button>
      <button onClick={() => setTheme('dark')}>set dark</button>
      <button onClick={() => setTheme('system')}>set system</button>
    </div>
  )
}

function renderWithProvider() {
  render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
}

describe('ThemeProvider', () => {
  describe('initialization', () => {
    it('defaults to system theme when nothing in localStorage', () => {
      renderWithProvider()
      expect(screen.getByTestId('theme').textContent).toBe('system')
    })

    it('restores light theme from localStorage', () => {
      localStorage.setItem('bill-split-theme', 'light')
      renderWithProvider()
      expect(screen.getByTestId('theme').textContent).toBe('light')
    })

    it('restores dark theme from localStorage', () => {
      localStorage.setItem('bill-split-theme', 'dark')
      renderWithProvider()
      expect(screen.getByTestId('theme').textContent).toBe('dark')
    })

    it('falls back to system for invalid localStorage value', () => {
      localStorage.setItem('bill-split-theme', 'invalid')
      renderWithProvider()
      expect(screen.getByTestId('theme').textContent).toBe('system')
    })
  })

  describe('resolved theme', () => {
    it('resolvedTheme is light when system prefers light (default mock)', () => {
      renderWithProvider()
      expect(screen.getByTestId('resolved').textContent).toBe('light')
    })

    it('resolvedTheme is dark when system prefers dark and theme is system', () => {
      window.matchMedia = vi.fn(() => ({
        matches: true,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia
      renderWithProvider()
      expect(screen.getByTestId('resolved').textContent).toBe('dark')
    })

    it('resolvedTheme follows explicit theme regardless of system', () => {
      localStorage.setItem('bill-split-theme', 'dark')
      window.matchMedia = vi.fn(() => ({
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia
      renderWithProvider()
      expect(screen.getByTestId('resolved').textContent).toBe('dark')
    })
  })

  describe('setTheme', () => {
    it('changes theme state', async () => {
      const user = userEvent.setup()
      renderWithProvider()
      await user.click(screen.getByText('set dark'))
      expect(screen.getByTestId('theme').textContent).toBe('dark')
    })

    it('persists theme to localStorage', async () => {
      const user = userEvent.setup()
      renderWithProvider()
      await user.click(screen.getByText('set dark'))
      expect(localStorage.getItem('bill-split-theme')).toBe('dark')
    })
  })

  describe('DOM class manipulation', () => {
    it('adds dark class when theme is dark', async () => {
      const user = userEvent.setup()
      renderWithProvider()
      await user.click(screen.getByText('set dark'))
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('removes dark class when theme is light', async () => {
      document.documentElement.classList.add('dark')
      const user = userEvent.setup()
      renderWithProvider()
      await user.click(screen.getByText('set light'))
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('applies dark class when system prefers dark and theme is system', () => {
      window.matchMedia = vi.fn(() => ({
        matches: true,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia
      renderWithProvider()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('useThemeContext outside provider', () => {
    it('throws when used outside ThemeProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => render(<ThemeConsumer />)).toThrow()
      consoleError.mockRestore()
    })
  })
})
