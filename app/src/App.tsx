import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import { AuthProvider, LogsProvider, useAuth } from './app/index'
import { Toast } from './ui/index'
import {
  Landing,
  Login,
  LogCreate,
  LogDetail,
  LogEdit,
  LogList,
  Settings,
} from './screens/index'

function LoadingScreen() {
  return <main className="loading" aria-live="polite">読み込み中…</main>
}

function LandingRoute() {
  const { session } = useAuth()
  return session === null ? <Landing /> : <Navigate to="/logs" replace />
}

function OAuthCallbackRoute() {
  const { session } = useAuth()
  return <Navigate to={session === null ? '/login' : '/logs'} replace />
}

function ProtectedRoute() {
  const { session } = useAuth()
  return session === null ? <Navigate to="/" replace /> : <Outlet />
}

function AppLayout() {
  const { invalidation, session, initializationError } = useAuth()
  const location = useLocation()
  const toast = (location.state as { toast?: string } | null)?.toast
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="service-name" to={session === null ? '/' : '/logs'}>Cumulog</Link>
        {session !== null && (
          <nav aria-label="アカウント">
            <span>{session.handle ?? session.did}</span>
            <Link to="/settings">設定</Link>
          </nav>
        )}
      </header>
      {invalidation !== null && (
        <div className="auth-banner" role="alert">
          認証が切れました。再ログインが必要です。 <Link to="/login">再ログイン</Link>
        </div>
      )}
      {initializationError !== null && session === null && (
        <div className="auth-banner" role="alert">
          ログイン処理を完了できませんでした。もう一度お試しください。 <Link to="/login">ログインへ</Link>
        </div>
      )}
      <main className="app-content"><Outlet /></main>
      {toast !== undefined && <Toast key={location.key} message={toast} />}
    </div>
  )
}

function AppRoutes() {
  const { status } = useAuth()
  if (status === 'loading') return <LoadingScreen />

  return (
    <LogsProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<LandingRoute />} />
          <Route path="login" element={<Login />} />
          <Route path="oauth/callback" element={<OAuthCallbackRoute />} />
          <Route element={<ProtectedRoute />}>
            <Route path="logs" element={<LogList />} />
            <Route path="logs/new" element={<LogCreate />} />
            <Route path="logs/:rkey" element={<LogDetail />} />
            <Route path="logs/:rkey/edit" element={<LogEdit />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </LogsProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider><AppRoutes /></AuthProvider>
    </BrowserRouter>
  )
}
