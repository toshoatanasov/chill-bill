import { ThemeProvider } from './context/theme-context'
import { AppStateProvider } from './context/app-state-context'
import { AppShell } from './components/app-shell'

export default function App() {
  return (
    <ThemeProvider>
      <AppStateProvider>
        <AppShell />
      </AppStateProvider>
    </ThemeProvider>
  )
}
