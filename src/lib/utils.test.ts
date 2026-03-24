import { describe, it, expect } from 'vitest'
import { cn, formatCurrency } from './utils'

describe('formatCurrency', () => {
  it('formats a whole number', () => {
    expect(formatCurrency(10, '€')).toBe('10.00 €')
  })

  it('formats a decimal to exactly 2 places', () => {
    expect(formatCurrency(10.5, '$')).toBe('10.50 $')
  })

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(1234.567, '€')).toBe('1234.57 €')
  })

  it('formats zero', () => {
    expect(formatCurrency(0, '£')).toBe('0.00 £')
  })

  it('uses the provided symbol verbatim', () => {
    expect(formatCurrency(5, 'CHF')).toBe('5.00 CHF')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('filters falsy values', () => {
    expect(cn('foo', false, undefined, 'bar')).toBe('foo bar')
  })

  it('resolves tailwind conflicts — later class wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles conditional object syntax', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500')
  })
})
