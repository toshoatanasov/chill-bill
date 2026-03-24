import { forwardRef, useState } from 'react'
import { Check, ImageDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Participant, Transaction } from '@/types'

interface FlowDiagramProps {
  transactions: Transaction[]
  participants: Participant[]
  currencySymbol: string
}

const NODE_WIDTH = 100
const NODE_HEIGHT = 36
const NODE_RADIUS = 8
const COL_GAP = 180
const ROW_GAP = 56
const PADDING = 20

/** Resolve a CSS custom property value from the document root */
function resolveCssVar(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

/** Convert oklch(...) or any color to hex via canvas */
function resolveColor(cssColor: string): string {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = cssColor
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return `rgb(${r},${g},${b})`
  } catch {
    return cssColor
  }
}

export const FlowDiagram = forwardRef<SVGSVGElement, FlowDiagramProps>(
  function FlowDiagram({ transactions, participants, currencySymbol }, ref) {
    const [imageCopied, setImageCopied] = useState(false)

    if (transactions.length === 0) return null

    const getName = (id: string) => participants.find((p) => p.id === id)?.name ?? 'Unknown'

    const debtorIds = [...new Set(transactions.map((t) => t.fromId))]
    const creditorIds = [...new Set(transactions.map((t) => t.toId))]

    const leftCount = debtorIds.length
    const rightCount = creditorIds.length
    const maxCount = Math.max(leftCount, rightCount)

    const svgHeight = maxCount * ROW_GAP + PADDING * 2
    const svgWidth = NODE_WIDTH * 2 + COL_GAP + PADDING * 2

    const leftX = PADDING
    const rightX = PADDING + NODE_WIDTH + COL_GAP

    const nodeY = (index: number, total: number) => {
      const totalHeight = total * NODE_HEIGHT + (total - 1) * (ROW_GAP - NODE_HEIGHT)
      const startY = (svgHeight - totalHeight) / 2
      return startY + index * ROW_GAP
    }

    const debtorPositions = new Map(
      debtorIds.map((id, i) => [id, { x: leftX, y: nodeY(i, leftCount) }]),
    )
    const creditorPositions = new Map(
      creditorIds.map((id, i) => [id, { x: rightX, y: nodeY(i, rightCount) }]),
    )

    const copyImage = async () => {
      // Resolve CSS variable colors to actual values for the exported image
      const primaryRaw = resolveCssVar('--primary')
      const foregroundRaw = resolveCssVar('--foreground')
      const backgroundRaw = resolveCssVar('--background')
      const cardRaw = resolveCssVar('--card')
      const borderRaw = resolveCssVar('--border')
      const mutedFgRaw = resolveCssVar('--muted-foreground')

      const primary = resolveColor(primaryRaw)
      const foreground = resolveColor(foregroundRaw)
      const background = resolveColor(backgroundRaw)
      const card = resolveColor(cardRaw)
      const border = resolveColor(borderRaw)
      const mutedFg = resolveColor(mutedFgRaw)

      // Compute primary/10 equivalent
      const primaryAlpha = primary.replace('rgb(', 'rgba(').replace(')', ', 0.1)')

      const scale = 2
      const W = svgWidth * scale
      const H = svgHeight * scale

      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)

      // Background
      ctx.fillStyle = background
      ctx.fillRect(0, 0, svgWidth, svgHeight)

      // Column labels
      ctx.fillStyle = mutedFg
      ctx.font = '10px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('PAYS', leftX + NODE_WIDTH / 2, 12)
      ctx.fillText('RECEIVES', rightX + NODE_WIDTH / 2, 12)

      // Helper: rounded rect
      const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + r)
        ctx.lineTo(x + w, y + h - r)
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
        ctx.lineTo(x + r, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - r)
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
        ctx.closePath()
      }

      // Draw arrows
      for (const t of transactions) {
        const from = debtorPositions.get(t.fromId)
        const to = creditorPositions.get(t.toId)
        if (!from || !to) continue

        const x1 = from.x + NODE_WIDTH
        const y1 = from.y + NODE_HEIGHT / 2
        const x2 = to.x
        const y2 = to.y + NODE_HEIGHT / 2
        const cx = (x1 + x2) / 2

        ctx.strokeStyle = primary
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.bezierCurveTo(cx, y1, cx, y2, x2, y2)
        ctx.stroke()

        // Arrowhead
        ctx.fillStyle = primary
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - 8, y2 - 4)
        ctx.lineTo(x2 - 8, y2 + 4)
        ctx.closePath()
        ctx.fill()

        // Amount label
        const lx = 0.5 * 0.5 * x1 + 2 * 0.5 * 0.5 * cx + 0.5 * 0.5 * x2
        const ly = 0.5 * 0.5 * y1 + 2 * 0.5 * 0.5 * ((y1 + y2) / 2) + 0.5 * 0.5 * y2
        const label = `${t.amount.toFixed(2)} ${currencySymbol}`
        const labelW = 52
        const labelH = 20

        roundRect(lx - labelW / 2, ly - labelH / 2, labelW, labelH, 4)
        ctx.fillStyle = card
        ctx.fill()
        ctx.strokeStyle = border
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.fillStyle = foreground
        ctx.font = '500 11px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(label, lx, ly + 4)
      }

      // Draw debtor nodes
      for (const id of debtorIds) {
        const pos = debtorPositions.get(id)
        if (!pos) continue
        roundRect(pos.x, pos.y, NODE_WIDTH, NODE_HEIGHT, NODE_RADIUS)
        ctx.fillStyle = card
        ctx.fill()
        ctx.strokeStyle = border
        ctx.lineWidth = 1.5
        ctx.stroke()

        const name = getName(id)
        const label = name.length > 10 ? name.slice(0, 10) + '…' : name
        ctx.fillStyle = foreground
        ctx.font = '500 12px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(label, pos.x + NODE_WIDTH / 2, pos.y + NODE_HEIGHT / 2 + 4)
      }

      // Draw creditor nodes
      for (const id of creditorIds) {
        const pos = creditorPositions.get(id)
        if (!pos) continue
        roundRect(pos.x, pos.y, NODE_WIDTH, NODE_HEIGHT, NODE_RADIUS)
        ctx.fillStyle = primaryAlpha
        ctx.fill()
        ctx.strokeStyle = primary
        ctx.lineWidth = 1.5
        ctx.stroke()

        const name = getName(id)
        const label = name.length > 10 ? name.slice(0, 10) + '…' : name
        ctx.fillStyle = primary
        ctx.font = '600 12px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(label, pos.x + NODE_WIDTH / 2, pos.y + NODE_HEIGHT / 2 + 4)
      }

      canvas.toBlob(async (blob) => {
        if (!blob) return
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          setImageCopied(true)
          setTimeout(() => setImageCopied(false), 2000)
        } catch {
          // Fallback: download the image
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'settlement.png'
          a.click()
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    }

    return (
      <div className="space-y-2">
        <div className="overflow-x-auto">
          <svg
            ref={ref}
            role="img"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width="100%"
            style={{ maxWidth: svgWidth, minWidth: 240 }}
            aria-label="Settlement flow diagram"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  className="fill-primary"
                />
              </marker>
            </defs>

            {/* Arrows */}
            {transactions.map((t, i) => {
              const from = debtorPositions.get(t.fromId)
              const to = creditorPositions.get(t.toId)
              if (!from || !to) return null

              const x1 = from.x + NODE_WIDTH
              const y1 = from.y + NODE_HEIGHT / 2
              const x2 = to.x
              const y2 = to.y + NODE_HEIGHT / 2

              const cx = (x1 + x2) / 2
              const cy1 = y1
              const cy2 = y2

              const t50 = 0.5
              const lx = (1 - t50) * (1 - t50) * x1 + 2 * (1 - t50) * t50 * cx + t50 * t50 * x2
              const ly =
                (1 - t50) * (1 - t50) * y1 +
                2 * (1 - t50) * t50 * ((cy1 + cy2) / 2) +
                t50 * t50 * y2

              return (
                <g key={i}>
                  <path
                    d={`M ${x1} ${y1} C ${cx} ${cy1}, ${cx} ${cy2}, ${x2} ${y2}`}
                    className="stroke-primary fill-none"
                    strokeWidth="1.5"
                    markerEnd="url(#arrowhead)"
                  />
                  <rect
                    x={lx - 26}
                    y={ly - 10}
                    width="52"
                    height="20"
                    rx="4"
                    className="fill-card stroke-border"
                    strokeWidth="1"
                  />
                  <text
                    x={lx}
                    y={ly + 4}
                    textAnchor="middle"
                    className="fill-foreground"
                    style={{ fontSize: 11, fontWeight: 500, fontFamily: 'inherit' }}
                  >
                    {t.amount.toFixed(2)} {currencySymbol}
                  </text>
                </g>
              )
            })}

            {/* Debtor nodes */}
            {debtorIds.map((id) => {
              const pos = debtorPositions.get(id)
              if (!pos) return null
              return (
                <g key={`d-${id}`}>
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={NODE_RADIUS}
                    className="fill-card stroke-border"
                    strokeWidth="1.5"
                  />
                  <text
                    x={pos.x + NODE_WIDTH / 2}
                    y={pos.y + NODE_HEIGHT / 2 + 4}
                    textAnchor="middle"
                    className="fill-foreground"
                    style={{ fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}
                  >
                    {getName(id).length > 10 ? getName(id).slice(0, 10) + '…' : getName(id)}
                  </text>
                </g>
              )
            })}

            {/* Creditor nodes */}
            {creditorIds.map((id) => {
              const pos = creditorPositions.get(id)
              if (!pos) return null
              return (
                <g key={`c-${id}`}>
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={NODE_RADIUS}
                    className="fill-primary/10 stroke-primary"
                    strokeWidth="1.5"
                  />
                  <text
                    x={pos.x + NODE_WIDTH / 2}
                    y={pos.y + NODE_HEIGHT / 2 + 4}
                    textAnchor="middle"
                    className="fill-primary"
                    style={{ fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
                  >
                    {getName(id).length > 10 ? getName(id).slice(0, 10) + '…' : getName(id)}
                  </text>
                </g>
              )
            })}

            {/* Column labels */}
            <text
              x={leftX + NODE_WIDTH / 2}
              y={12}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 10, fontFamily: 'inherit' }}
            >
              PAYS
            </text>
            <text
              x={rightX + NODE_WIDTH / 2}
              y={12}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 10, fontFamily: 'inherit' }}
            >
              RECEIVES
            </text>
          </svg>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={copyImage}
        >
          {imageCopied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <ImageDown className="h-3.5 w-3.5" />
              Copy Image
            </>
          )}
        </Button>
      </div>
    )
  },
)
