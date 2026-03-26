import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Participant } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, symbol: string): string {
  return `${amount.toFixed(2)} ${symbol}`
}

export function getParticipantName(participants: Participant[], id: string): string {
  return participants.find((p) => p.id === id)?.name ?? 'Unknown'
}
