import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAuth, useLogs } from '../app/index'
import { getAgent } from '../atproto/oauth'
import { deleteLog, RecordClientError } from '../atproto/records'
import { effectiveSpoilerLevel, rkeyFromAtUri, type LogEntry } from '../domain/index'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Notice,
  SpoilerBadge,
} from '../ui/index'
import styles from './LogDetail.module.css'

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className={styles.field}><dt>{label}</dt><dd>{children}</dd></div>
}

function DeleteDescription({ entry }: { entry: LogEntry }) {
  if (entry.kind === 'unreadable') {
    return <>
      <p>削除する活動ログ：</p>
      <p className={styles.identifier}>{entry.uri}</p>
      <p>削除しても、外部サービスや他のクライアントに取得済みの情報が残る可能性があります。</p>
    </>
  }
  return <>
    <p>削除する活動ログ：</p>
    <p><strong>{entry.record.title}</strong>（活動日：{entry.record.activityDate}）</p>
    <p>削除しても、外部サービスや他のクライアントに取得済みの情報が残る可能性があります。</p>
  </>
}

export function LogDetail() {
  const { rkey } = useParams<{ rkey: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { status, entries, reload, applyDeleted } = useLogs()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (status === 'idle' || status === 'loading') {
    return <main className={styles.page} aria-live="polite"><p>活動ログを読み込んでいます…</p></main>
  }

  if (status === 'error') {
    return <ErrorState title="活動ログを取得できませんでした" description="通信に失敗しました。もう一度お試しください。" onRetry={() => void reload()} />
  }

  const entry = entries.find((candidate) => rkeyFromAtUri(candidate.uri) === rkey)
  if (entry === undefined) {
    return <EmptyState
      title="活動ログが見つかりません"
      description="削除済みか、現在の一覧に存在しない活動ログです。"
      action={<Link className={styles.action} to="/logs">一覧へ戻る</Link>}
    />
  }

  const openDeleteDialog = () => {
    setDeleteError(null)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    setDialogOpen(false)
    const agent = getAgent()
    if (agent === null || session === null) {
      setDeleteError('認証情報を確認できないため、削除できませんでした。再ログインしてからもう一度お試しください。')
      setDeleting(false)
      return
    }
    const currentRkey = rkey
    if (currentRkey === undefined) {
      setDeleteError('活動ログを識別できないため、削除できませんでした。再読み込みしてからもう一度お試しください。')
      setDeleting(false)
      return
    }
    try {
      await deleteLog(agent, session.did, currentRkey, entry.cid)
      applyDeleted(entry.uri)
      navigate('/logs', { replace: true, state: { toast: '活動ログを削除しました' } })
    } catch (error) {
      if (error instanceof RecordClientError && error.kind === 'not-found') {
        // 対象はすでに存在しない（他クライアントで削除済み等）。再試行しても失敗し続けるため削除済みとして扱う
        applyDeleted(entry.uri)
        navigate('/logs', { replace: true, state: { toast: '活動ログはすでに削除されていました' } })
        return
      }
      if (error instanceof RecordClientError && error.kind === 'conflict') {
        setDeleteError('削除確認で表示した内容と現在のログが異なるため、削除しませんでした。再読み込み後に、改めて削除を確認してください。')
        await reload()
      } else if (error instanceof RecordClientError && error.kind === 'auth-expired') {
        setDeleteError('認証が切れたため、削除できませんでした。再ログインしてからもう一度お試しください。')
      } else {
        setDeleteError('活動ログを削除できませんでした。もう一度お試しください。')
      }
      setDeleting(false)
    }
  }

  return <main className={styles.page}>
    <p><Link to="/logs">← 一覧へ戻る</Link></p>
    {deleteError !== null && <Notice variant="error">
      <p>{deleteError}</p>
      <div className={styles.errorActions}>
        {deleteError.includes('再ログイン') && <Link to="/login">再ログイン</Link>}
        <Button type="button" variant="secondary" onClick={openDeleteDialog} disabled={deleting}>削除を再試行</Button>
      </div>
    </Notice>}
    {entry.kind === 'unreadable' ? <>
      <header className={styles.header}><h1>読み込めない活動ログ</h1></header>
      <Notice variant="warning">この活動ログは内容を解釈できないため表示できません。</Notice>
      <p className={styles.identifier}>at-uri：{entry.uri}</p>
      <div className={styles.actions}><Button type="button" variant="danger" onClick={openDeleteDialog} disabled={deleting}>削除</Button></div>
    </> : <>
      <header className={styles.header}><h1>{entry.record.title}</h1><SpoilerBadge level={effectiveSpoilerLevel(entry.record)} /></header>
      <Notice variant="public">AT Protocol上の公開レコードとして保存されています。<span className={styles.identifier}>at-uri：{entry.uri}</span></Notice>
      <dl className={styles.details}>
        <Field label="活動日">{entry.record.activityDate}</Field>
        <Field label="タイトル">{entry.record.title}</Field>
        <Field label="活動種別">{entry.record.category ?? 'なし'}</Field>
        <Field label="対象名">{entry.record.subject ?? 'なし'}</Field>
        <Field label="タグ">{entry.record.tags?.length ? entry.record.tags.join('、') : 'なし'}</Field>
        <Field label="メモ"><span className={styles.preformatted}>{entry.record.note ?? 'なし'}</span></Field>
        <Field label="外部URL">{entry.record.urls?.length ? <ul className={styles.urlList}>{entry.record.urls.map((url) => <li key={url}>{isHttpUrl(url) ? <a href={url} target="_blank" rel="noopener noreferrer">{url}</a> : <span>{url}</span>}</li>)}</ul> : 'なし'}</Field>
        <Field label="ネタバレ"><SpoilerBadge level={effectiveSpoilerLevel(entry.record)} />{effectiveSpoilerLevel(entry.record) === 'none' && 'ネタバレなし'}</Field>
      </dl>
      <div className={styles.actions}><Link className={styles.action} to={`/logs/${rkey}/edit`}>編集</Link><Button type="button" variant="danger" onClick={openDeleteDialog} disabled={deleting}>削除</Button></div>
    </>}
    <ConfirmDialog open={dialogOpen} title="活動ログを削除しますか？" description={<DeleteDescription entry={entry} />} confirmLabel="削除する" cancelLabel="取り消す" confirmVariant="danger" onConfirm={() => void handleDelete()} onCancel={() => setDialogOpen(false)} />
  </main>
}
