import type { Participant, Transaction } from '@/types'
import { getParticipantName } from './utils'

interface DiagramLayout {
  svgWidth: number
  svgHeight: number
  nodeWidth: number
  nodeHeight: number
  nodeRadius: number
  debtorPositions: Map<string, { x: number; y: number }>
  creditorPositions: Map<string, { x: number; y: number }>
  debtorIds: string[]
  creditorIds: string[]
}

interface ResolvedColors {
  primary: string
  foreground: string
  background: string
  card: string
  border: string
  mutedFg: string
}

/** Resolve a CSS custom property value from the document root */
export function resolveCssVar(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

/** Convert oklch(...) or any color to hex via canvas */
export function resolveColor(cssColor: string): string {
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

function resolveThemeColors(): ResolvedColors {
  const primaryRaw = resolveCssVar('--primary')
  const foregroundRaw = resolveCssVar('--foreground')
  const backgroundRaw = resolveCssVar('--background')
  const cardRaw = resolveCssVar('--card')
  const borderRaw = resolveCssVar('--border')
  const mutedFgRaw = resolveCssVar('--muted-foreground')

  return {
    primary: resolveColor(primaryRaw),
    foreground: resolveColor(foregroundRaw),
    background: resolveColor(backgroundRaw),
    card: resolveColor(cardRaw),
    border: resolveColor(borderRaw),
    mutedFg: resolveColor(mutedFgRaw),
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function truncateName(name: string, maxLen = 10): string {
  return name.length > maxLen ? name.slice(0, maxLen) + '…' : name
}

export function exportDiagramToCanvas(
  layout: DiagramLayout,
  transactions: Transaction[],
  participants: Participant[],
  currencySymbol: string,
  onComplete: (blob: Blob | null) => void,
): void {
  const colors = resolveThemeColors()
  const primaryAlpha = colors.primary.replace('rgb(', 'rgba(').replace(')', ', 0.1)')

  const { svgWidth, svgHeight, nodeWidth, nodeHeight, nodeRadius, debtorPositions, creditorPositions, debtorIds, creditorIds } = layout
  const leftX = debtorPositions.values().next().value?.x ?? 0
  const rightX = creditorPositions.values().next().value?.x ?? 0

  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = svgWidth * scale
  canvas.height = svgHeight * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)

  // Background
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, svgWidth, svgHeight)

  // Column labels
  ctx.fillStyle = colors.mutedFg
  ctx.font = '10px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('PAYS', leftX + nodeWidth / 2, 12)
  ctx.fillText('RECEIVES', rightX + nodeWidth / 2, 12)

  // Draw arrows
  for (const t of transactions) {
    const from = debtorPositions.get(t.fromId)
    const to = creditorPositions.get(t.toId)
    if (!from || !to) continue

    const x1 = from.x + nodeWidth
    const y1 = from.y + nodeHeight / 2
    const x2 = to.x
    const y2 = to.y + nodeHeight / 2
    const cx = (x1 + x2) / 2

    ctx.strokeStyle = colors.primary
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.bezierCurveTo(cx, y1, cx, y2, x2, y2)
    ctx.stroke()

    // Arrowhead
    ctx.fillStyle = colors.primary
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

    roundRect(ctx, lx - labelW / 2, ly - labelH / 2, labelW, labelH, 4)
    ctx.fillStyle = colors.card
    ctx.fill()
    ctx.strokeStyle = colors.border
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = colors.foreground
    ctx.font = '500 11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(label, lx, ly + 4)
  }

  // Draw debtor nodes
  for (const id of debtorIds) {
    const pos = debtorPositions.get(id)
    if (!pos) continue
    roundRect(ctx, pos.x, pos.y, nodeWidth, nodeHeight, nodeRadius)
    ctx.fillStyle = colors.card
    ctx.fill()
    ctx.strokeStyle = colors.border
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = colors.foreground
    ctx.font = '500 12px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(truncateName(getParticipantName(participants, id)), pos.x + nodeWidth / 2, pos.y + nodeHeight / 2 + 4)
  }

  // Draw creditor nodes
  for (const id of creditorIds) {
    const pos = creditorPositions.get(id)
    if (!pos) continue
    roundRect(ctx, pos.x, pos.y, nodeWidth, nodeHeight, nodeRadius)
    ctx.fillStyle = primaryAlpha
    ctx.fill()
    ctx.strokeStyle = colors.primary
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = colors.primary
    ctx.font = '600 12px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(truncateName(getParticipantName(participants, id)), pos.x + nodeWidth / 2, pos.y + nodeHeight / 2 + 4)
  }

  canvas.toBlob((blob) => onComplete(blob), 'image/png')
}
