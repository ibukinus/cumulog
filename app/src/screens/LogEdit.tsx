import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAuth, useLogs } from '../app/index'
import { getAgent } from '../atproto/oauth'
import { RecordClientError, updateLog } from '../atproto/records'
import { collectCategories, collectTags, CUMULOG_LOG_COLLECTION, rkeyFromAtUri, type ActivityLogRecordInput, type CumulogLogRecord } from '../domain/index'
import { Button, ErrorState, Notice } from '../ui/index'
import { LogForm } from './LogForm'

export function LogEdit() {
  const { rkey = '' } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const logs = useLogs()
  const entry = logs.entries.find((item) => rkeyFromAtUri(item.uri) === rkey)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<RecordClientError | null>(null)
  const [retry, setRetry] = useState<(() => void) | null>(null)

  // entryが見つかっている間はreload中でもフォームを維持する（アンマウントすると編集中の入力が失われるため）
  if (entry === undefined) {
    if (logs.status === 'idle' || logs.status === 'loading') return <p aria-live="polite">活動ログを読み込んでいます…</p>
    if (logs.status === 'error') return <ErrorState title="編集する活動ログを取得できませんでした" description="通信に失敗しました。入力を始める前に、もう一度読み込んでください。" onRetry={() => void logs.reload()} />
    return <section><h1>この活動ログは編集できません</h1><p>活動ログが見つかりません。削除済みか、別の場所で変更された可能性があります。</p><Link to="/logs">一覧へ戻る</Link></section>
  }
  if (entry.kind === 'unreadable') return <section><h1>この活動ログは編集できません</h1><p>読み込めない形式の活動ログは編集できません。詳細画面から確認してください。</p><Link to={`/logs/${rkey}`}>活動ログの詳細へ戻る</Link></section>

  const record = entry.record
  const swapCid = entry.cid

  function errorContent(): ReactNode {
    if (error === null) return null
    if (error.kind === 'conflict') return <Notice variant="error"><div>対象の活動ログが別の場所で変更されているため、更新しませんでした。入力内容は保持されています。<br /><Button type="button" variant="secondary" onClick={() => void logs.reload()}>最新の一覧を再読み込み</Button></div></Notice>
    if (error.kind === 'auth-expired') return <Notice variant="error"><p>認証が切れたため更新できませんでした。入力内容は保持されています。<br /><Link to="/login">再ログインしてください</Link>。</p></Notice>
    if (error.kind === 'permission') return <Notice variant="error"><div>更新する権限がありません。再ログインで解決する場合があります。<br /><Link to="/login">再ログインする</Link>{retry && <> または <Button type="button" variant="secondary" onClick={retry}>再試行</Button></>}</div></Notice>
    if (error.kind === 'maybe-saved') return <Notice variant="warning"><div>更新されたか確認できませんでした。再試行する前に<Button type="button" variant="secondary" onClick={() => void logs.reload()}>一覧を再読み込み</Button>して確認してください。</div></Notice>
    return <Notice variant="error"><div>活動ログを更新できませんでした。入力内容は保持されています。{retry && <><br /><Button type="button" variant="secondary" onClick={retry}>再試行</Button></>}</div></Notice>
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
      // recordを展開すると空に編集した任意項目が旧値のまま残るため、検証済みのvalueのみを正とする
      const updatedRecord: CumulogLogRecord = { ...value, $type: CUMULOG_LOG_COLLECTION, createdAt: record.createdAt }
      const result = await updateLog(agent, session.did, rkey, updatedRecord, swapCid)
      logs.applyUpdated(result.uri, result.cid, updatedRecord)
      navigate(`/logs/${rkey}`, { replace: true, state: { toast: '活動ログを更新しました。' } })
    } catch (cause) {
      const clientError = cause instanceof RecordClientError ? cause : new RecordClientError('failed', cause)
      setError(clientError)
      if (clientError.kind === 'failed' || clientError.kind === 'permission') setRetry(() => run)
    } finally {
      setSaving(false)
    }
  }

  return <LogForm
    mode="edit"
    initialValue={{
      title: record.title,
      activityDate: record.activityDate,
      category: record.category ?? '',
      subject: record.subject ?? '',
      tags: record.tags ?? [],
      urls: record.urls ?? [],
      note: record.note ?? '',
      spoiler: record.spoiler,
    }}
    categorySuggestions={collectCategories(logs.entries)}
    tagSuggestions={collectTags(logs.entries)}
    saving={saving}
    saveError={errorContent()}
    onSave={save}
  />
}
