# 02 — EUR Currency + Copy Text/Image for Settlement

## Context
Three improvements to the settlement step: switch default currency from USD to EUR, add a copyable text summary of transactions, and add a "copy as image" button for the flow diagram.

## Changes

### 1. Currency: USD → EUR
- **File:** `src/hooks/use-app-state.ts` — change `currencySymbol: '$'` → `currencySymbol: '€'`
- **File:** `src/lib/utils.ts` — update `formatCurrency` to put `€` after the number with a space (European convention: `25.00 €` instead of `€25.00`)

### 2. Text summary with copy-to-clipboard
- **File:** `src/components/settlement/settlement-step.tsx`
  - Add a new section between the transaction list and flow diagram
  - Render a `<pre>` or monospace block showing one transaction per line: `Alice → Bob: 25.00 €`
  - Add a "Copy" button using `navigator.clipboard.writeText()`
  - Show brief "Copied!" feedback (swap button text for ~2s)
  - Build the text from `transactions` array + participant name lookup

### 3. Copy flow diagram as image
- **File:** `src/components/settlement/flow-diagram.tsx`
  - Wrap SVG in a `ref`
  - Add a "Copy Image" button below the diagram
  - On click: serialize SVG to string → render into an offscreen `<canvas>` → `canvas.toBlob()` → `navigator.clipboard.write()` with `ClipboardItem` (image/png)
  - Show brief "Copied!" feedback
  - Need to inline computed styles (fill/stroke colors) since clipboard SVG won't have CSS context — resolve CSS variables to actual color values before serialization

### Files to modify
1. `src/hooks/use-app-state.ts` — default currency symbol
2. `src/lib/utils.ts` — formatCurrency for EUR convention
3. `src/components/settlement/settlement-step.tsx` — add text summary section + copy button
4. `src/components/settlement/flow-diagram.tsx` — add ref + copy image button

### Verification
1. `npm run build` — no errors
2. `npm run dev` → add participants + expenses → go to settlement
3. Verify amounts show as `25.00 €` (not `€25.00`)
4. Verify text block shows one transaction per line, "Copy" button copies to clipboard
5. Verify "Copy Image" button copies the SVG as a PNG to clipboard (paste into any image app)
6. Test light + dark mode — copied image should have correct colors
