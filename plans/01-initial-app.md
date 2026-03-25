# 01 — Initial App (Chill Bill)

## Context
Build a client-side bill-splitting calculator: users enter participants and shared expenses, the app computes the minimum set of transactions to settle all debts, and displays results as a list and a visual flow diagram. No backend — all state lives in localStorage.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS 4 |
| UI primitives | shadcn/ui (`base-nova` style, using `@base-ui/react`) |
| Icons | lucide-react |
| Font | Geist Variable (`@fontsource-variable/geist`) |
| Persistence | localStorage |

---

## Data Model (`src/types/index.ts`)

```ts
type SplitMode = 'equal' | 'percentage' | 'exact'

interface Participant { id: string; name: string }

interface SplitDetail { participantId: string; value: number }

interface Expense {
  id: string; description: string; amount: number
  paidById: string; splitMode: SplitMode
  splitAmong: string[]; splitDetails: SplitDetail[]
}

interface Transaction { fromId: string; toId: string; amount: number }

interface AppState {
  participants: Participant[]; expenses: Expense[]
  currencySymbol: string; currentStep: number
}

type AppAction =
  | { type: 'ADD_PARTICIPANT'; name: string }
  | { type: 'REMOVE_PARTICIPANT'; id: string }
  | { type: 'ADD_EXPENSE'; expense: Omit<Expense, 'id'> }
  | { type: 'REMOVE_EXPENSE'; id: string }
  | { type: 'EDIT_EXPENSE'; expense: Expense }
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_CURRENCY_SYMBOL'; symbol: string }
  | { type: 'RESET' }
```

---

## Architecture

### State management (`src/hooks/use-app-state.ts`)
- `useReducer` with the 8 action types above
- Auto-saves to / hydrates from localStorage on every change
- `crypto.randomUUID()` for all IDs

### Settlement algorithm (`src/lib/settlement.ts`)
1. Compute each participant's net balance (sum of what they paid minus their share across all expenses)
2. Split into creditors (net > 0) and debtors (net < 0), sort descending by absolute value
3. Greedy two-pointer: match largest debtor to largest creditor until all balances reach ~0 (threshold 0.005 to absorb floating-point noise)
4. Rounds to 2 decimal places

### Theme (`src/context/theme-context.tsx`)
- Three modes: `light` | `dark` | `system`
- Persists to localStorage
- Listens to `prefers-color-scheme` media query for `system` mode
- Applies/removes `dark` class on `<html>`

### Persistence (`src/lib/storage.ts`)
- `saveState` / `loadState` — full `AppState` JSON
- `saveTheme` / `loadTheme` — theme string
- `clearState` — reset key

---

## Three-Step Wizard

### Step 0 — Participants (`src/components/participants/`)
- Add participant by name (Enter or button); duplicates rejected (case-insensitive)
- Remove participant (cascades: all their expenses are deleted too)
- Next button enabled when ≥ 2 participants

### Step 1 — Expenses (`src/components/expenses/`)
- Add/edit/delete expenses
- Fields: description, amount, payer (Select), split mode (Tabs: Equal / Percentage / Exact)
- **Equal**: divides evenly among selected participants
- **Percentage**: each participant gets a % input; must sum to 100
- **Exact**: each participant gets an amount input; must sum to total
- Validation in `src/lib/validation.ts`
- Edit opens a Dialog with the form pre-filled

### Step 2 — Settlement (`src/components/settlement/`)
- Summary card: participant count, expense count, total amount
- Transaction list: "A pays B: X.XX €"
- Flow diagram: debtors on left → creditors on right via bezier curves, color-coded by theme
- "Start New" button → confirmation Dialog → dispatches `RESET`

---

## Component Hierarchy

```
App
└── ThemeProvider
    └── AppShell
        ├── Header (logo + ThemeToggle)
        ├── StepIndicator
        └── ParticipantStep | ExpenseStep | SettlementStep
```

---

## Key Files

| File | Role |
|---|---|
| `src/types/index.ts` | All types |
| `src/hooks/use-app-state.ts` | State + reducer |
| `src/context/theme-context.tsx` | Theme provider |
| `src/lib/settlement.ts` | Settlement algorithm |
| `src/lib/validation.ts` | Expense validation |
| `src/lib/storage.ts` | localStorage helpers |
| `src/lib/utils.ts` | `cn()`, `formatCurrency()` |
| `src/components/app-shell.tsx` | Layout + step routing |
| `src/components/participants/` | Step 0 |
| `src/components/expenses/` | Step 1 |
| `src/components/settlement/` | Step 2 |

---

## Verification
1. `npm run build` — no errors
2. `npm run dev` — add 3 participants, add 2 expenses with different split modes, reach settlement step
3. Verify transactions balance to zero (all debts settled)
4. Refresh page — state persists
5. Toggle theme — persists across reload
