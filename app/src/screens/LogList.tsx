import type { KeyboardEvent, MouseEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useLogs } from '../app/index'
import {
  effectiveSpoilerLevel,
  filterByTag,
  rkeyFromAtUri,
  type LogEntry,
} from '../domain/index'
import { Button, EmptyState, ErrorState, SpoilerBadge } from '../ui/index'
import styles from './LogList.module.css'

function ExternalLinkIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 4h5v5M20 4l-9 9" />
      <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
    </svg>
  )
}

function LogRow({ entry, onSelectTag }: { entry: LogEntry; onSelectTag: (tag: string) => void }) {
  const navigate = useNavigate()
  const rkey = rkeyFromAtUri(entry.uri)

  const openDetail = () => {
    if (rkey !== null) navigate(`/logs/${encodeURIComponent(rkey)}`)
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openDetail()
    }
  }
  const handleTagClick = (event: MouseEvent<HTMLButtonElement>, tag: string) => {
    event.stopPropagation()
    onSelectTag(tag)
  }

  if (entry.kind === 'unreadable') {
    return (
      <li>
        <article
          className={styles.row}
          role="link"
          tabIndex={rkey === null ? -1 : 0}
          aria-label="読み込めない活動ログの詳細を表示"
          onClick={openDetail}
          onKeyDown={handleKeyDown}
        >
          <h2 className={styles.title}>読み込めない活動ログ</h2>
          <p className={styles.uri}>{entry.uri}</p>
        </article>
      </li>
    )
  }

  const { record } = entry
  return (
    <li>
      <article
        className={styles.row}
        role="link"
        tabIndex={rkey === null ? -1 : 0}
        aria-label={`${record.title}の詳細を表示`}
        onClick={openDetail}
        onKeyDown={handleKeyDown}
      >
        <time className={styles.date} dateTime={record.activityDate}>{record.activityDate}</time>
        <h2 className={styles.title}>{record.title}</h2>
        {(record.category || record.subject) && (
          <p className={styles.metadata}>
            {record.category && <span>{record.category}</span>}
            {record.subject && <span>{record.subject}</span>}
          </p>
        )}
        <div className={styles.labels}>
          {record.tags?.map((tag) => (
            <button
              className={styles.tag}
              type="button"
              key={tag}
              onClick={(event) => handleTagClick(event, tag)}
            >
              #{tag}
            </button>
          ))}
          {record.urls && record.urls.length > 0 && (
            <span className={styles.urlIndicator} aria-label="外部URLあり" title="外部URLあり">
              <ExternalLinkIcon />
              <span>外部URLあり</span>
            </span>
          )}
          <SpoilerBadge level={effectiveSpoilerLevel(record)} />
        </div>
      </article>
    </li>
  )
}

export function LogList() {
  const { status, entries, reload } = useLogs()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTag = searchParams.get('tag') || null
  const visibleEntries = selectedTag === null ? entries : filterByTag(entries, selectedTag)

  const selectTag = (tag: string) => setSearchParams({ tag })
  const clearTag = () => setSearchParams({})
  const createButton = (
    <Button type="button" onClick={() => navigate('/logs/new')}>活動ログを作成</Button>
  )

  let content
  if (status === 'idle' || status === 'loading') {
    content = <p className={styles.loading} role="status">活動ログを読み込み中…</p>
  } else if (status === 'error') {
    content = (
      <ErrorState
        title="活動ログの取得に失敗しました"
        description="活動ログを取得できませんでした。通信状況を確認して、もう一度お試しください。"
        onRetry={() => void reload()}
      />
    )
  } else if (entries.length === 0) {
    content = (
      <EmptyState
        title="まだ活動ログがないようです"
        description="最初の活動を記録してみましょう。"
        action={createButton}
      />
    )
  } else if (visibleEntries.length === 0) {
    content = (
      <EmptyState
        title="このタグの活動ログはありません"
        description="絞り込みを解除すると、すべての活動ログを表示できます。"
      />
    )
  } else {
    content = (
      <ol className={styles.list} aria-label="活動ログ">
        {visibleEntries.map((entry) => (
          <LogRow key={entry.uri} entry={entry} onSelectTag={selectTag} />
        ))}
      </ol>
    )
  }

  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <h1>活動ログ</h1>
        {createButton}
      </header>
      {selectedTag !== null && status === 'loaded' && (
        <div className={styles.filter} aria-label="タグ絞り込み">
          <span>「#{selectedTag}」で絞り込み中</span>
          <Button type="button" variant="secondary" onClick={clearTag}>絞り込みを解除</Button>
        </div>
      )}
      {content}
    </section>
  )
}
