import { useCallback, useRef } from 'react'
import { BrowserRouter, useNavigate, Routes, Route, Navigate } from 'react-router-dom'
import type { DemoShellRole } from '@osac/api-contracts'
import { SessionProvider, useSession } from './contexts/SessionContext'
import { WelcomePage } from './pages/WelcomePage'
import { SignInPage } from './pages/SignInPage'
import { AppShell } from './pages/AppShell'

function InnerApp() {
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  const onNavigateAfterLogin = useCallback((role: DemoShellRole) => {
    if (role === 'providerAdmin') navigateRef.current('/provider/dashboard')
    else if (role === 'tenantAdmin') navigateRef.current('/admin/dashboard')
    else navigateRef.current('/dashboard')
  }, [])

  const onNavigateToWelcome = useCallback(() => {
    navigateRef.current('/')
  }, [])

  return (
    <SessionProvider
      onNavigateAfterLogin={onNavigateAfterLogin}
      onNavigateToWelcome={onNavigateToWelcome}
    >
      <AppRoutes />
    </SessionProvider>
  )
}

function AppRoutes() {
  const { isLoggedIn, selectedTenant } = useSession()

  return (
    <Routes>
      <Route
        path="/"
        element={
          selectedTenant && !isLoggedIn ? (
            <Navigate to="/sign-in" replace />
          ) : (
            <WelcomePage />
          )
        }
      />
      <Route
        path="/sign-in"
        element={
          isLoggedIn || !selectedTenant ? (
            <Navigate to={isLoggedIn ? '/dashboard' : '/'} replace />
          ) : (
            <SignInPage />
          )
        }
      />
      <Route
        path="/*"
        element={
          isLoggedIn ? (
            <AppShell />
          ) : (
            <Navigate to={selectedTenant ? '/sign-in' : '/'} replace />
          )
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <InnerApp />
    </BrowserRouter>
  )
}
