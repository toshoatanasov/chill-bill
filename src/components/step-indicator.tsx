import { cn } from '@/lib/utils'

const STEPS = ['Participants', 'Expenses', 'Settlement']

interface StepIndicatorProps {
  currentStep: number
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((label, index) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                index < currentStep && 'bg-primary text-primary-foreground',
                index === currentStep && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background',
                index > currentStep && 'bg-muted text-muted-foreground',
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                index === currentStep ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={cn(
                'mx-2 mb-5 h-px w-12 transition-colors sm:w-20',
                index < currentStep ? 'bg-primary' : 'bg-border',
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
