/* oxlint-disable react/only-export-components -- providerと専用hookを同じ公開単位にする */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'

import {
  initAuth,
  onAuthInvalidated,
  signIn as startSignIn,
  signOut as endSession,
  type AuthInvalidation,
  type Session,
} from '../atproto/oauth'

type AuthStatus = 'loading' | 'ready'

type AuthContextValue = {
  status: AuthStatus
  session: Session | null
  invalidation: AuthInvalidation | null
  initializationError: unknown
  signIn: (handle: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const initialization = useRef<Promise<Session | null> | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [invalidation, setInvalidation] = useState<AuthInvalidation | null>(null)
  const [initializationError, setInitializationError] = useState<unknown>(null)

  useEffect(() => {
    let active = true
    initialization.current ??= initAuth()
    void initialization.current.then(
      (initializedSession) => {
        if (!active) return
        setSession(initializedSession)
        // セッションが確立できた＝認証は有効。初期化中に発生した失効通知（古いセッションの
        // 掃除等によるもの）は現在のセッションには当たらないため取り下げる
        if (initializedSession !== null) setInvalidation(null)
        setStatus('ready')
      },
      (error: unknown) => {
        if (!active) return
        setInitializationError(error)
        setStatus('ready')
      },
    )
    return () => {
      active = false
    }
  }, [])

  useEffect(() => onAuthInvalidated(setInvalidation), [])

  const signIn = useCallback(async (handle: string) => {
    setInvalidation(null)
    await startSignIn(handle)
  }, [])

  const signOut = useCallback(async () => {
    try {
      await endSession()
    } finally {
      setSession(null)
      setInvalidation(null)
      navigate('/', { replace: true })
    }
  }, [navigate])

  const value = useMemo<AuthContextValue>(() => ({
    status,
    session,
    invalidation,
    initializationError,
    signIn,
    signOut,
  }), [initializationError, invalidation, session, signIn, signOut, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (value === null) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
