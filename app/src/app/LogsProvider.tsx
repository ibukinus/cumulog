/* oxlint-disable react/only-export-components -- providerと専用hookを同じ公開単位にする */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'

import { getAgent } from '../atproto/oauth'
import { listAllLogs } from '../atproto/records'
import type { CumulogLogRecord } from '../domain/types'
import { useAuth } from './AuthProvider'
import { initialLogsState, logsReducer, type LogsState } from './logs-state'

type LogsContextValue = LogsState & {
  reload: () => Promise<void>
  applyCreated: (uri: string, cid: string, record: CumulogLogRecord) => void
  applyUpdated: (uri: string, cid: string, record: CumulogLogRecord) => void
  applyDeleted: (uri: string) => void
}

const LogsContext = createContext<LogsContextValue | null>(null)

export function LogsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [state, dispatch] = useReducer(logsReducer, initialLogsState)
  const requestSequence = useRef(0)

  const reload = useCallback(async () => {
    const request = ++requestSequence.current
    if (session === null) {
      dispatch({ type: 'reset' })
      return
    }
    const agent = getAgent()
    if (agent === null) {
      dispatch({ type: 'failed', error: new Error('Authenticated agent is unavailable') })
      return
    }
    dispatch({ type: 'loading' })
    try {
      const entries = await listAllLogs(agent, session.did)
      if (request !== requestSequence.current) return
      dispatch({ type: 'loaded', entries })
    } catch (error) {
      if (request !== requestSequence.current) return
      dispatch({ type: 'failed', error })
    }
  }, [session])

  useEffect(() => {
    void reload()
  }, [reload])

  const applyCreated = useCallback((uri: string, cid: string, record: CumulogLogRecord) => {
    dispatch({ type: 'created', uri, cid, record })
  }, [])
  const applyUpdated = useCallback((uri: string, cid: string, record: CumulogLogRecord) => {
    dispatch({ type: 'updated', uri, cid, record })
  }, [])
  const applyDeleted = useCallback((uri: string) => {
    dispatch({ type: 'deleted', uri })
  }, [])

  const value = useMemo<LogsContextValue>(() => ({
    ...state,
    reload,
    applyCreated,
    applyUpdated,
    applyDeleted,
  }), [applyCreated, applyDeleted, applyUpdated, reload, state])

  return <LogsContext.Provider value={value}>{children}</LogsContext.Provider>
}

export function useLogs(): LogsContextValue {
  const value = useContext(LogsContext)
  if (value === null) throw new Error('useLogs must be used inside LogsProvider')
  return value
}
