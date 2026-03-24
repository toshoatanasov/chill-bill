import { SplitSquareVertical } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeToggle } from './theme-toggle'
import { StepIndicator } from './step-indicator'
import { ParticipantStep } from './participants/participant-step'
import { ExpenseStep } from './expenses/expense-step'
import { SettlementStep } from './settlement/settlement-step'
import { useAppState } from '@/hooks/use-app-state'

export function AppShell() {
  const { state, dispatch } = useAppState()

  return (
    <TooltipProvider>
      <div className="min-h-svh bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <SplitSquareVertical className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Chill Bill</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Main */}
        <main className="mx-auto max-w-2xl px-4 py-8 space-y-8">
          <StepIndicator currentStep={state.currentStep} />

          {state.currentStep === 0 && (
            <ParticipantStep state={state} dispatch={dispatch} />
          )}
          {state.currentStep === 1 && (
            <ExpenseStep state={state} dispatch={dispatch} />
          )}
          {state.currentStep === 2 && (
            <SettlementStep state={state} dispatch={dispatch} />
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}
