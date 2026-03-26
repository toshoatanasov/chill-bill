import { cn } from '@/lib/utils'
import type { Step } from '@/types'

const STEPS: { key: Step; label: string }[] = [
  { key: 'participants', label: 'Participants' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'settlement', label: 'Settlement' },
]

interface StepIndicatorProps {
  currentStep: Step
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map(({ key, label }, index) => (
        <div key={key} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                index < currentIndex && 'bg-gradient-to-br from-[#863bff] to-[#47bfff] text-white',
                index === currentIndex && 'btn-shimmer text-white ring-2 ring-purple-400/40 ring-offset-2 ring-offset-background scale-110 step-glow',
                index > currentIndex && 'bg-muted text-muted-foreground',
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                index === currentIndex ? 'font-semibold text-gradient' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div className="relative mx-2 mb-5 h-0.5 w-12 overflow-hidden rounded-full bg-border sm:w-20">
              {index < currentIndex && (
                <div className="absolute inset-0 origin-left bg-gradient-to-r from-[#863bff] to-[#47bfff] animate-[connector-fill_0.5s_ease-out_forwards]" />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
