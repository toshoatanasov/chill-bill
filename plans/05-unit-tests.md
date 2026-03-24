# 05 — Unit Tests (Vitest + React Testing Library, 90% coverage)

## Context
No tests exist. Adding comprehensive unit tests targeting ≥90% coverage across all business logic, hooks, context, and components. Shadcn-generated `src/components/ui/**` is excluded from coverage.

---

## Setup

### Install
```
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

### `vite.config.ts` — add `test` block
```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.ts',
  coverage: {
    provider: 'v8',
    include: ['src/**'],
    exclude: ['src/components/ui/**', 'src/main.tsx', 'src/App.tsx'],
    thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
  },
}
```

### `tsconfig.app.json` — add `"vitest/globals"` to `types` array

### `package.json` — add scripts
```json
"test": "vitest",
"test:coverage": "vitest run --coverage"
```

### `src/test/setup.ts`
- `import '@testing-library/jest-dom'`
- In-memory `localStorage` mock (`vi.stubGlobal`) — reset in global `beforeEach`
- `window.matchMedia` mock returning `{ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }`
- `crypto.randomUUID` stub returning `'test-uuid'` by default

---

## Test Files

### `src/lib/utils.test.ts` (~40 lines)
- `formatCurrency`: whole number, 2dp rounding, zero, multi-char symbol
- `cn`: merges classes, filters falsy, resolves Tailwind conflicts

### `src/lib/storage.test.ts` (~90 lines)
- `loadState`: null on empty, parsed on valid JSON, null on malformed JSON
- `saveState`: serializes under `bill-split-state` key, overwrites previous
- `clearState`: removes key, no-op when absent
- `loadTheme` / `saveTheme`: get/set `bill-split-theme`

### `src/lib/validation.test.ts` (~120 lines)
- `validatePercentageSplit`: sums to 100 ✓, within epsilon ✓, below/above 100 ✗, empty array ✗
- `validateExactSplit`: sums to total ✓, differs by >epsilon ✗, strict `< 0.01` boundary
- `validateExpense`: each error path individually (empty desc, amount=0, no payer, empty splitAmong, bad % split, bad exact split); all errors together; fully valid equal/percentage/exact

### `src/lib/settlement.test.ts` (~200 lines)
Key scenarios:
- Empty inputs → `[]`
- All-equal case → `[]` (no transactions needed)
- 2-person: A paid for both → 1 transaction
- 3-person greedy minimization → 2 transactions (not 3)
- Netting: participant both owes and is owed across expenses
- Percentage split (60/40)
- Exact split
- Rounding: 10 ÷ 3 → amounts are 2dp, 3.33 each
- Near-zero balance filtered (0.004 below threshold → no transaction)
- Multiple expenses by same payer aggregate correctly
- Result structure: `fromId`, `toId`, positive `amount`

### `src/hooks/use-app-state.test.ts` (~160 lines)
Use `renderHook` + `act`. Key cases:
- Init from empty localStorage → DEFAULT_STATE
- Init from pre-populated localStorage
- `useEffect` identity guard: `saveState` NOT called on mount, called after any dispatch
- All 8 reducer actions verified
- `REMOVE_PARTICIPANT` cascade: removes participant's expenses and expenses they're split among
- `RESET`: returns DEFAULT_STATE + calls `clearState()`

### `src/context/theme-context.test.tsx` (~120 lines)
Render `<ThemeProvider><Consumer /></ThemeProvider>`. Key cases:
- Defaults to system; restores light/dark/system from localStorage; ignores invalid values
- `resolvedTheme` follows `matchMedia.matches` for system theme
- `setTheme` updates state + persists to localStorage
- DOM: `add/remove('dark')` on `document.documentElement`
- System media query listener fires → resolvedTheme updates
- `useThemeContext` throws outside provider

### `src/components/participants/participant-form.test.tsx` (~100 lines)
- Renders label, input, Add button
- Empty submit → error, no `onAdd` call
- Duplicate name (case-insensitive) → error, no `onAdd` call
- Typing after error clears error
- Valid submit → calls `onAdd` with trimmed name, clears input

### `src/components/participants/participant-list.test.tsx` (~70 lines)
- Empty state message
- Renders one item per participant with sequential numbers
- Remove button aria-label = `"Remove {name}"`
- Click remove → `onRemove` called with correct id

### `src/components/participants/participant-step.test.tsx` (~80 lines)
- Next disabled for 0 and 1 participants; enabled for ≥2
- Hint shown at exactly 1 participant
- Next click → `dispatch({ type: 'SET_STEP', step: 1 })`
- Dispatches `ADD_PARTICIPANT` / `REMOVE_PARTICIPANT` via form/list

### `src/components/expenses/split-config.test.tsx` (~130 lines)
- **Equal**: checkboxes per participant; shows per-person share when amount > 0; toggle calls `onSplitAmongChange`
- **Percentage**: inputs per participant; remaining % indicator; ✓ 100% when balanced; calculated amount shown; `onSplitDetailsChange` on input
- **Exact**: inputs; remaining amount indicator; ✓ Balanced when sums match; `onSplitDetailsChange` on input

### `src/components/expenses/expense-form.test.tsx` (~160 lines)
- Add mode: renders all fields; all participants in splitAmong; validation errors in Alert; `onSubmit` not called on invalid; form resets after valid add
- Edit mode: pre-fills fields; "Save Changes" button; Cancel calls `onCancel`; no reset after edit
- Tab switching resets splitDetails (equal %s for percentage, 0s for exact)
- Select payer updates `paidById`

### `src/components/expenses/expense-list.test.tsx` (~120 lines)
- Empty state message
- Renders card per expense with description, formatted amount, payer name, split badge
- Total amount displayed; correct pluralization
- Delete → `dispatch(REMOVE_EXPENSE)`
- Edit button opens dialog; `EDIT_EXPENSE` dispatched on save; dialog closes on cancel/save
- Unknown paidById → "Unknown"

### `src/components/expenses/expense-step.test.tsx` (~60 lines)
- Calculate Settlement disabled with no expenses; enabled with expenses
- Back → `SET_STEP 0`; Calculate → `SET_STEP 2`

### `src/components/settlement/transaction-list.test.tsx` (~70 lines)
- Empty state message
- Card per transaction: "Name → Name: amount €"
- Unknown participant id → "Unknown"
- `formatCurrency` output format

### `src/components/settlement/settlement-step.test.tsx` (~140 lines)
Mock `navigator.clipboard.writeText`, use `vi.useFakeTimers()` for copy feedback:
- Summary stats: people count, expense count, total amount
- Text summary section hidden when no transactions; shown with correct format
- Copy text → `clipboard.writeText` called; "Copied!" shown; reverts after 2s
- Flow diagram section hidden when no transactions
- Back → `SET_STEP 1`
- Start New opens dialog; Cancel closes; Confirm → `RESET`

### `src/components/settlement/flow-diagram.test.tsx` (~90 lines)
Mock canvas context, `navigator.clipboard.write`, `toBlob`, `getComputedStyle`:
- Returns null when transactions empty
- Renders SVG with `aria-label`
- PAYS/RECEIVES labels; debtor and creditor nodes; bezier arrows
- Name >10 chars truncated with `…`
- Copy Image → canvas drawn → `clipboard.write` called; "Copied!" shown; reverts after 2s
- `clipboard.write` rejects → download fallback (anchor `.click()` called)
- `ref` forwarded to SVG element

### `src/components/step-indicator.test.tsx` (~60 lines)
- Renders "Participants", "Expenses", "Settlement" labels + numbers 1, 2, 3
- Step 0 active: step 1 ring, 2+3 muted; lines = border color
- Step 1 active: step 1 completed, step 2 ring, step 3 muted; first line primary
- Step 2 active: steps 1+2 completed, step 3 ring; both lines primary
- Active label = foreground; inactive = muted-foreground

### `src/components/theme-toggle.test.tsx` (~80 lines)
Wrap in `ThemeProvider` + `TooltipProvider`. Mock localStorage to preset theme.
- Sun/Moon/Monitor icon per theme
- Correct aria-label per theme
- Click cycles: light→dark→system→light

### `src/components/app-shell.test.tsx` (~80 lines)
`vi.mock('@/hooks/use-app-state')` and `vi.mock('@/hooks/use-theme')` to avoid full integration:
- Header shows "Chill Bill"
- currentStep=0 → ParticipantStep rendered, not others
- currentStep=1 → ExpenseStep rendered
- currentStep=2 → SettlementStep rendered
- StepIndicator rendered with correct step

---

## Important Mocking Notes

- **`@base-ui/react` Select**: After clicking trigger, items render in `document.body` portal. Use `userEvent.setup()` for proper async interactions.
- **`@base-ui/react` Dialog**: Content in portal. Query by dialog title or `role="dialog"`.
- **Canvas mock** (for `flow-diagram`): Stub `getContext`, `toBlob`, `getImageData` (returns gray pixel `[128,128,128,255]`).
- **`crypto.randomUUID`** in tests needing multiple IDs: use `.mockReturnValueOnce('id-1').mockReturnValueOnce('id-2')`.
- **Fake timers**: `vi.useFakeTimers()` / `vi.useRealTimers()` in beforeEach/afterEach for copy feedback tests.

---

## Implementation Order
1. Setup (`vite.config.ts`, `tsconfig.app.json`, `package.json`, `src/test/setup.ts`) — verify `npm test` runs
2. Pure logic: `utils`, `storage`, `validation`, `settlement` — highest ROI, no React
3. Hook + context: `use-app-state`, `theme-context`
4. Leaf components: `participant-form`, `participant-list`, `transaction-list`, `step-indicator`
5. Composite: `split-config`, `expense-form`, `theme-toggle`
6. Step containers: `participant-step`, `expense-list`, `expense-step`
7. Complex: `settlement-step`, `flow-diagram`, `app-shell`

---

## Verification
```
npm run test:coverage
```
All thresholds (lines, functions, branches, statements) must be ≥90%.
