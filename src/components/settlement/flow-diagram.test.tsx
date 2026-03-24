import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { FlowDiagram } from './flow-diagram'
import type { Participant, Transaction } from '@/types'

const participants: Participant[] = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
]

const transactions: Transaction[] = [
  { fromId: 'bob', toId: 'alice', amount: 25 },
]

// Canvas mock
const mockCtx = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: 'center' as CanvasTextAlign,
  fillRect: vi.fn(),
  fillText: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  scale: vi.fn(),
  closePath: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([128, 128, 128, 255]) })),
}

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx as unknown as CanvasRenderingContext2D)
  HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => cb(new Blob([''], { type: 'image/png' })))
  Object.defineProperty(window, 'getComputedStyle', {
    value: vi.fn(() => ({
      getPropertyValue: vi.fn(() => '0.205 0 0'),
    })),
  })
  // ClipboardItem is not available in jsdom — stub with a plain constructor
  vi.stubGlobal('ClipboardItem', function ClipboardItemStub(this: object, items: Record<string, Blob>) {
    Object.assign(this, { items })
  })
})

afterEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('FlowDiagram', () => {
  describe('rendering', () => {
    it('returns null when transactions is empty', () => {
      const { container } = render(
        <FlowDiagram transactions={[]} participants={participants} currencySymbol="€" />
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders an SVG with aria-label', () => {
      render(<FlowDiagram transactions={transactions} participants={participants} currencySymbol="€" />)
      expect(screen.getByRole('img', { name: /settlement flow diagram/i })).toBeInTheDocument()
    })

    it('renders PAYS and RECEIVES column labels', () => {
      render(<FlowDiagram transactions={transactions} participants={participants} currencySymbol="€" />)
      expect(screen.getByText('PAYS')).toBeInTheDocument()
      expect(screen.getByText('RECEIVES')).toBeInTheDocument()
    })

    it('renders participant names in nodes', () => {
      render(<FlowDiagram transactions={transactions} participants={participants} currencySymbol="€" />)
      expect(screen.getAllByText('Bob')).toHaveLength(1)
      expect(screen.getAllByText('Alice')).toHaveLength(1)
    })

    it('truncates names longer than 10 characters', () => {
      const longName: Participant[] = [
        { id: 'x', name: 'VeryLongName' },
        { id: 'y', name: 'Short' },
      ]
      const tx: Transaction[] = [{ fromId: 'x', toId: 'y', amount: 10 }]
      render(<FlowDiagram transactions={tx} participants={longName} currencySymbol="€" />)
      expect(screen.getByText('VeryLongNa…')).toBeInTheDocument()
    })

    it('renders the Copy Image button', () => {
      render(<FlowDiagram transactions={transactions} participants={participants} currencySymbol="€" />)
      expect(screen.getByRole('button', { name: /copy image/i })).toBeInTheDocument()
    })
  })

  describe('forwardRef', () => {
    it('forwards ref to SVG element', () => {
      const ref = createRef<SVGSVGElement>()
      render(<FlowDiagram ref={ref} transactions={transactions} participants={participants} currencySymbol="€" />)
      expect(ref.current).toBeInstanceOf(SVGSVGElement)
    })
  })

  describe('copy image button', () => {
    it('calls navigator.clipboard.write on click', async () => {
      const user = userEvent.setup()
      const clipboardWrite = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { write: clipboardWrite },
        configurable: true,
      })

      render(<FlowDiagram transactions={transactions} participants={participants} currencySymbol="€" />)
      await user.click(screen.getByRole('button', { name: /copy image/i }))
      // Flush pending microtasks from the async toBlob callback
      await act(async () => {})
      expect(clipboardWrite).toHaveBeenCalled()
    })

    it('shows "Copied!" after successful copy', async () => {
      vi.useFakeTimers()
      Object.defineProperty(navigator, 'clipboard', {
        value: { write: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
      })

      render(<FlowDiagram transactions={transactions} participants={participants} currencySymbol="€" />)
      // Wrap click + microtask flush in a single async act so React processes
      // setImageCopied(true) within the act context
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /copy image/i }))
        // Flush the toBlob callback + clipboard.write promise chain (microtasks)
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })

    it('falls back to download when clipboard.write fails', async () => {
      const user = userEvent.setup()
      Object.defineProperty(navigator, 'clipboard', {
        value: { write: vi.fn().mockRejectedValue(new Error('denied')) },
        configurable: true,
      })

      const createObjectURL = vi.fn(() => 'blob:fake')
      const revokeObjectURL = vi.fn()
      Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true })
      Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true })

      const clickSpy = vi.fn()
      const mockAnchor = { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement
      const originalCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag, options?) => {
        if (tag === 'a') return mockAnchor
        return originalCreateElement(tag, options)
      })

      render(<FlowDiagram transactions={transactions} participants={participants} currencySymbol="€" />)
      await user.click(screen.getByRole('button', { name: /copy image/i }))
      await act(async () => {})
      expect(clickSpy).toHaveBeenCalled()

      vi.restoreAllMocks()
    })
  })
})
