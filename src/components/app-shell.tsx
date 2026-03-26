import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppStateContext } from '@/context/app-state-context'
import { ThemeToggle } from './theme-toggle'
import { StepIndicator } from './step-indicator'
import { ParticipantStep } from './participants/participant-step'
import { ExpenseStep } from './expenses/expense-step'
import { SettlementStep } from './settlement/settlement-step'
import { ChillBillLogo } from './logo'

export function AppShell() {
  const { state, dispatch } = useAppStateContext()

  return (
    <TooltipProvider>
      <div className="min-h-svh bg-background bg-dot-grid">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-border/30 bg-background/50 backdrop-blur-xl">
          <div className="h-1 bg-gradient-to-r from-[#863bff] via-[#c471ed] to-[#47bfff] bg-[length:200%_100%] animate-[mesh-rotate_4s_ease_infinite]" />
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <ChillBillLogo className="h-7 w-7" />
              <span className="font-bold text-sm tracking-tight text-gradient">Chill Bill</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Main */}
        <main className="mx-auto max-w-2xl px-4 py-8 space-y-8">
          <StepIndicator currentStep={state.currentStep} />

          {state.currentStep === 'participants' && (
            <ParticipantStep state={state} dispatch={dispatch} />
          )}
          {state.currentStep === 'expenses' && (
            <ExpenseStep state={state} dispatch={dispatch} />
          )}
          {state.currentStep === 'settlement' && (
            <SettlementStep state={state} dispatch={dispatch} />
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}
