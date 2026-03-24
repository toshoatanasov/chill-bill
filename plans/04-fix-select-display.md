# 04 — Fix: Select dropdown shows UUID instead of name

## Context
The "Paid by" dropdown in the expense form shows the participant's UUID (e.g., `e89fa3f7-f0d8-...`) instead of their name after selection. The `@base-ui/react` Select's `Value` component renders the raw `value` prop, not the `ItemText` content like Radix does.

## Fix
**File:** `src/components/expenses/expense-form.tsx`

Replace `<SelectValue placeholder="Select who paid" />` with a manual lookup that shows the participant name or the placeholder.

## Verification
- Select a participant in "Paid by" dropdown
- Trigger should show their name, not UUID
