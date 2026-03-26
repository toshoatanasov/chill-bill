import { forwardRef, useState } from 'react'
import { Check, ImageDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getParticipantName } from '@/lib/utils'
import { exportDiagramToCanvas } from '@/lib/export-diagram'
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

interface DiagramNodeProps {
  x: number
  y: number
  label: string
  variant: 'debtor' | 'creditor'
}

function DiagramNode({ x, y, label, variant }: DiagramNodeProps) {
  const truncated = label.length > 10 ? label.slice(0, 10) + '…' : label
  const isCreditor = variant === 'creditor'

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={NODE_RADIUS}
        className={isCreditor ? 'fill-primary/10 stroke-primary' : 'fill-card stroke-border'}
        strokeWidth="1.5"
      />
      <text
        x={x + NODE_WIDTH / 2}
        y={y + NODE_HEIGHT / 2 + 4}
        textAnchor="middle"
        className={isCreditor ? 'fill-primary' : 'fill-foreground'}
        style={{ fontSize: 12, fontWeight: isCreditor ? 600 : 500, fontFamily: 'inherit' }}
      >
        {truncated}
      </text>
    </g>
  )
}

export const FlowDiagram = forwardRef<SVGSVGElement, FlowDiagramProps>(
  function FlowDiagram({ transactions, participants, currencySymbol }, ref) {
    const [imageCopied, setImageCopied] = useState(false)

    if (transactions.length === 0) return null

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

    const copyImage = () => {
      exportDiagramToCanvas(
        { svgWidth, svgHeight, nodeWidth: NODE_WIDTH, nodeHeight: NODE_HEIGHT, nodeRadius: NODE_RADIUS, debtorPositions, creditorPositions, debtorIds, creditorIds },
        transactions,
        participants,
        currencySymbol,
        async (blob) => {
          if (!blob) return
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            setImageCopied(true)
            setTimeout(() => setImageCopied(false), 2000)
          } catch {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'settlement.png'
            a.click()
            URL.revokeObjectURL(url)
          }
        },
      )
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
                <DiagramNode
                  key={`d-${id}`}
                  x={pos.x}
                  y={pos.y}
                  label={getParticipantName(participants, id)}
                  variant="debtor"
                />
              )
            })}

            {/* Creditor nodes */}
            {creditorIds.map((id) => {
              const pos = creditorPositions.get(id)
              if (!pos) return null
              return (
                <DiagramNode
                  key={`c-${id}`}
                  x={pos.x}
                  y={pos.y}
                  label={getParticipantName(participants, id)}
                  variant="creditor"
                />
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
