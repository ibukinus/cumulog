import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { fetchPublicLog, resolveOwnerHandle } from '../atproto/public'
import { RecordClientError } from '../atproto/records'
import { effectiveSpoilerLevel, type LogEntry } from '../domain/index'
import { EmptyState, ErrorState, Notice, SpoilerBadge } from '../ui/index'
import styles from './SharedLog.module.css'

type PageState =
  | { kind: 'loading' }
  | { kind: 'display'; entry: LogEntry }
  | { kind: 'not-found' }
  | { kind: 'failed' }

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

function LandingLink() {
  return <Link className={styles.action} to="/">Cumulogについて</Link>
}

export function SharedLog() {
  const { did, rkey } = useParams<{ did: string; rkey: string }>()
  const [state, setState] = useState<PageState>({ kind: 'loading' })
  const [owner, setOwner] = useState(did ?? '')
  const [request, setRequest] = useState(0)
  const retry = useCallback(() => setRequest((current) => current + 1), [])

  useEffect(() => {
    if (did === undefined || rkey === undefined) {
      setState({ kind: 'not-found' })
      return
    }

    let active = true
    setState({ kind: 'loading' })
    setOwner(did)

    void resolveOwnerHandle(did).then((handle) => {
      if (active && handle !== null) setOwner(`@${handle}`)
    }).catch(() => {
      // handleを解決できない場合は、設計どおりDIDを表示する。
    })

    void fetchPublicLog(did, rkey).then((entry) => {
      if (active) setState({ kind: 'display', entry })
    }).catch((error: unknown) => {
      if (!active) return
      setState(error instanceof RecordClientError && error.kind === 'not-found'
        ? { kind: 'not-found' }
        : { kind: 'failed' })
    })

    return () => { active = false }
  }, [did, rkey, request])

  if (state.kind === 'loading') {
    return <section className={styles.page} aria-live="polite"><p className={styles.loading}>活動ログを読み込んでいます…</p></section>
  }

  if (state.kind === 'not-found') {
    return <EmptyState
      title="活動ログが見つかりません"
      description="削除済みか、存在しない活動ログです。"
      action={<LandingLink />}
    />
  }

  if (state.kind === 'failed') {
    return <div className={styles.state}><ErrorState
      title="活動ログを取得できませんでした"
      description="通信に失敗しました。もう一度お試しください。"
      onRetry={retry}
    /><LandingLink /></div>
  }

  if (state.entry.kind === 'unreadable') {
    return <section className={styles.page}>
      <header className={styles.header}><h1>表示できない活動ログ</h1></header>
      <Notice variant="warning">この活動ログは内容を解釈できないため表示できません。</Notice>
      <p className={styles.identifier}>at-uri：{state.entry.uri}</p>
      <LandingLink />
    </section>
  }

  const { record } = state.entry
  const spoilerLevel = effectiveSpoilerLevel(record)
  return <article className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.owner}>記録した人：{owner}</p><h1>{record.title}</h1></div>
      <SpoilerBadge level={spoilerLevel} />
    </header>
    <Notice variant="public">この活動ログはAT Protocol上の公開データです。</Notice>
    <dl className={styles.details}>
      <Field label="活動日">{record.activityDate}</Field>
      <Field label="タイトル">{record.title}</Field>
      <Field label="活動種別">{record.category ?? 'なし'}</Field>
      <Field label="対象名">{record.subject ?? 'なし'}</Field>
      <Field label="タグ">{record.tags?.length ? record.tags.join('、') : 'なし'}</Field>
      <Field label="メモ"><span className={styles.preformatted}>{record.note ?? 'なし'}</span></Field>
      <Field label="外部URL">{record.urls?.length ? <ul className={styles.urlList}>{record.urls.map((url) => <li key={url}>{isHttpUrl(url) ? <a href={url} target="_blank" rel="noopener noreferrer">{url}</a> : <span>{url}</span>}</li>)}</ul> : 'なし'}</Field>
      <Field label="ネタバレ"><SpoilerBadge level={spoilerLevel} />{spoilerLevel === 'none' && 'ネタバレなし'}</Field>
    </dl>
    <aside className={styles.about} aria-labelledby="about-cumulog">
      <h2 id="about-cumulog">Cumulogについて</h2>
      <p>Cumulogは、日々の活動をAT Protocol上に記録する公開活動ログサービスです。</p>
      <LandingLink />
    </aside>
  </article>
}
