import { cn } from '@/lib/utils'

interface ChillBillLogoProps {
  className?: string
}

export function ChillBillLogo({ className }: ChillBillLogoProps) {
  return (
    <svg
      className={cn('h-7 w-7 animate-[float_6s_ease-in-out_infinite]', className)}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#863bff" />
          <stop offset="50%" stopColor="#c471ed" />
          <stop offset="100%" stopColor="#47bfff" />
        </linearGradient>
        <linearGradient id="lg2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#47bfff" />
          <stop offset="100%" stopColor="#863bff" />
        </linearGradient>
        <linearGradient id="lg-center" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#863bff" />
          <stop offset="100%" stopColor="#47bfff" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Snowflake arms */}
      <g filter="url(#glow)">
        {/* Vertical arm */}
        <line x1="16" y1="2.5" x2="16" y2="29.5" stroke="url(#lg1)" strokeWidth="2" strokeLinecap="round" />
        {/* Diagonal arm: top-right to bottom-left */}
        <line x1="27.9" y1="9" x2="4.1" y2="23" stroke="url(#lg1)" strokeWidth="2" strokeLinecap="round" />
        {/* Diagonal arm: top-left to bottom-right */}
        <line x1="4.1" y1="9" x2="27.9" y2="23" stroke="url(#lg1)" strokeWidth="2" strokeLinecap="round" />

        {/* Branch tips — small V shapes */}
        {/* Top */}
        <path d="M13.2 5.8 L16 2.5 L18.8 5.8" stroke="url(#lg2)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        {/* Bottom */}
        <path d="M13.2 26.2 L16 29.5 L18.8 26.2" stroke="url(#lg2)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        {/* Top-right */}
        <path d="M26.2 11.5 L27.9 9 L25.2 7.8" stroke="url(#lg2)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        {/* Bottom-left */}
        <path d="M5.8 20.5 L4.1 23 L6.8 24.2" stroke="url(#lg2)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        {/* Top-left */}
        <path d="M5.8 11.5 L4.1 9 L6.8 7.8" stroke="url(#lg2)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        {/* Bottom-right */}
        <path d="M26.2 20.5 L27.9 23 L25.2 24.2" stroke="url(#lg2)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </g>

      {/* Center circle with $ */}
      <circle cx="16" cy="16" r="5.5" fill="url(#lg-center)" opacity="0.95" />
      <text
        x="16"
        y="19.5"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="bold"
        fill="white"
        fontFamily="system-ui, sans-serif"
      >
        $
      </text>

      {/* Dashed horizontal split line */}
      <line x1="10" y1="16" x2="22" y2="16" stroke="white" strokeWidth="0.7" strokeDasharray="1.5 1.2" opacity="0.55" />

      {/* Animated sparkle dots */}
      <circle cx="8.5" cy="7" r="1" fill="#47bfff" className="animate-[sparkle_2s_ease-in-out_infinite]" />
      <circle cx="24.5" cy="6" r="0.7" fill="#c471ed" className="animate-[sparkle_2.5s_ease-in-out_0.5s_infinite]" />
      <circle cx="26.5" cy="25.5" r="0.8" fill="#47bfff" className="animate-[sparkle_3s_ease-in-out_1s_infinite]" />
      <circle cx="5.5" cy="26" r="0.6" fill="#863bff" className="animate-[sparkle_2s_ease-in-out_1.5s_infinite]" />
      <circle cx="27" cy="16" r="0.5" fill="#c471ed" className="animate-[sparkle_1.8s_ease-in-out_0.8s_infinite]" />
    </svg>
  )
}
