import { createContext, useContext } from 'react'
import { useAppState } from '@/hooks/use-app-state'
import type { AppAction, AppState } from '@/types'

interface AppStateContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const value = useAppState()
  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppStateContext(): AppStateContextValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppStateContext must be used within AppStateProvider')
  return ctx
}
