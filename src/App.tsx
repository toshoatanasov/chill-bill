import { ThemeProvider } from './context/theme-context'
import { AppShell } from './components/app-shell'

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}
