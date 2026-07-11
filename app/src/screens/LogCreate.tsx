import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth, useLogs } from '../app/index'
import { getAgent } from '../atproto/oauth'
import { createLog, RecordClientError } from '../atproto/records'
import { collectCategories, collectTags, type ActivityLogRecordInput } from '../domain/index'
import { Button, Notice } from '../ui/index'
import { LogForm } from './LogForm'

function today(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

export function LogCreate() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { entries, reload } = useLogs()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<RecordClientError | null>(null)
  const [retry, setRetry] = useState<(() => void) | null>(null)

  function errorContent(): ReactNode {
    if (error === null) return null
    if (error.kind === 'auth-expired') return <Notice variant="error"><p>認証が切れたため保存できませんでした。入力内容は保持されています。<br /><Link to="/login">再ログインしてください</Link>。</p></Notice>
    if (error.kind === 'permission') return <Notice variant="error"><div>保存する権限がありません。再ログインで解決する場合があります。<br /><Link to="/login">再ログインする</Link>{retry && <> または <Button type="button" variant="secondary" onClick={retry}>再試行</Button></>}</div></Notice>
    if (error.kind === 'maybe-saved') return <Notice variant="warning"><div>保存されたか確認できませんでした。二重登録を避けるため、再試行する前に<Button type="button" variant="secondary" onClick={() => void reload()}>一覧を再読み込み</Button>して確認してください。</div></Notice>
    return <Notice variant="error"><div>活動ログを保存できませんでした。入力内容は保持されています。{retry && <><br /><Button type="button" variant="secondary" onClick={retry}>再試行</Button></>}</div></Notice>
  }

  async function save(value: ActivityLogRecordInput) {
    if (saving || session === null) return
    const run = () => { void save(value) }
    setSaving(true)
    setError(null)
    setRetry(null)
    try {
      const agent = getAgent()
      if (agent === null) throw new RecordClientError('auth-expired')
      await createLog(agent, session.did, value)
      // createLog内で採番されたcreatedAtを正確に反映するためPDSから再取得する。
      await reload()
      navigate('/logs', { replace: true, state: { toast: '活動ログを保存しました。' } })
    } catch (cause) {
      const clientError = cause instanceof RecordClientError ? cause : new RecordClientError('failed', cause)
      setError(clientError)
      if (clientError.kind === 'failed' || clientError.kind === 'permission') setRetry(() => run)
    } finally {
      setSaving(false)
    }
  }

  return <LogForm
    mode="create"
    initialValue={{ title: '', activityDate: today(), category: '', subject: '', tags: [], urls: [], note: '', spoiler: 'none' }}
    categorySuggestions={collectCategories(entries)}
    tagSuggestions={collectTags(entries)}
    saving={saving}
    saveError={errorContent()}
    onSave={save}
  />
}
