import type { KeyboardEvent, MouseEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useLogs } from '../app/index'
import {
  effectiveSpoilerLevel,
  filterByCategory,
  filterByEmotion,
  filterByMonth,
  filterBySubject,
  filterByTag,
  formatYearMonthLabel,
  rkeyFromAtUri,
  type LogEntry,
} from '../domain/index'
import { ExternalLinkIcon } from '../ui/icons'
import { Button, EmptyState, ErrorState, SpoilerBadge } from '../ui/index'
import styles from './LogList.module.css'

function LogRow({
  entry,
  onSelectTag,
  onSelectEmotion,
  onSelectCategory,
  onSelectSubject,
  onSelectMonth,
}: {
  entry: LogEntry
  onSelectTag: (tag: string) => void
  onSelectEmotion: (emotion: string) => void
  onSelectCategory: (category: string) => void
  onSelectSubject: (subject: string) => void
  onSelectMonth: (month: string) => void
}) {
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
  const handleCategoryClick = (event: MouseEvent<HTMLButtonElement>, category: string) => {
    event.stopPropagation()
    onSelectCategory(category)
  }
  const handleEmotionClick = (event: MouseEvent<HTMLButtonElement>, emotion: string) => {
    event.stopPropagation()
    onSelectEmotion(emotion)
  }
  const handleSubjectClick = (event: MouseEvent<HTMLButtonElement>, subject: string) => {
    event.stopPropagation()
    onSelectSubject(subject)
  }
  const handleMonthClick = (event: MouseEvent<HTMLButtonElement>, month: string) => {
    event.stopPropagation()
    onSelectMonth(month)
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
        <button
          className={styles.date}
          type="button"
          aria-label={`「${formatYearMonthLabel(record.activityDate.slice(0, 7))}」で絞り込み`}
          onClick={(event) => handleMonthClick(event, record.activityDate.slice(0, 7))}
        >
          <time dateTime={record.activityDate}>{record.activityDate}</time>
        </button>
        <h2 className={styles.title}>{record.title}</h2>
        {(record.category || record.subject) && (
          <p className={styles.metadata}>
            {record.category && (
              <button
                className={styles.metadataItem}
                type="button"
                aria-label={`活動種別「${record.category}」で絞り込み`}
                onClick={(event) => handleCategoryClick(event, record.category!)}
              >
                {record.category}
              </button>
            )}
            {record.subject && (
              <button
                className={styles.metadataItem}
                type="button"
                aria-label={`対象名「${record.subject}」で絞り込み`}
                onClick={(event) => handleSubjectClick(event, record.subject!)}
              >
                {record.subject}
              </button>
            )}
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
          {record.emotions?.map((emotion) => (
            <button
              className={styles.emotion}
              type="button"
              key={emotion}
              aria-label={`感情「${emotion}」で絞り込み`}
              onClick={(event) => handleEmotionClick(event, emotion)}
            >
              感情：{emotion}
            </button>
          ))}
          {record.urls && record.urls.length > 0 && (
            <span className={styles.urlIndicator} aria-label="外部URLあり" title="外部URLあり">
              <ExternalLinkIcon className={styles.icon} />
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
  const tag = searchParams.get('tag')
  const emotion = searchParams.get('emotion')
  const category = searchParams.get('category')
  const subject = searchParams.get('subject')
  const month = searchParams.get('month')
  const selectedFilter = tag
    ? { kind: 'tag' as const, value: tag }
    : emotion
      ? { kind: 'emotion' as const, value: emotion }
    : category
      ? { kind: 'category' as const, value: category }
      : subject
        ? { kind: 'subject' as const, value: subject }
        : month
          ? { kind: 'month' as const, value: month }
          : null
  const visibleEntries = selectedFilter === null
    ? entries
    : selectedFilter.kind === 'tag'
      ? filterByTag(entries, selectedFilter.value)
      : selectedFilter.kind === 'emotion'
        ? filterByEmotion(entries, selectedFilter.value)
      : selectedFilter.kind === 'category'
        ? filterByCategory(entries, selectedFilter.value)
        : selectedFilter.kind === 'subject'
          ? filterBySubject(entries, selectedFilter.value)
          : filterByMonth(entries, selectedFilter.value)

  const selectTag = (tag: string) => setSearchParams({ tag })
  const selectEmotion = (emotion: string) => setSearchParams({ emotion })
  const selectCategory = (category: string) => setSearchParams({ category })
  const selectSubject = (subject: string) => setSearchParams({ subject })
  const selectMonth = (month: string) => setSearchParams({ month })
  const clearFilter = () => setSearchParams({})
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
        title="この条件に一致する活動ログはありません"
        description="絞り込みを解除すると、すべての活動ログを表示できます。"
      />
    )
  } else {
    content = (
      <ol className={styles.list} aria-label="活動ログ">
        {visibleEntries.map((entry) => (
          <LogRow
            key={entry.uri}
            entry={entry}
            onSelectTag={selectTag}
            onSelectEmotion={selectEmotion}
            onSelectCategory={selectCategory}
            onSelectSubject={selectSubject}
            onSelectMonth={selectMonth}
          />
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
      {selectedFilter !== null && status === 'loaded' && (
        <div className={styles.filter} aria-label="絞り込み">
          <span>
            {selectedFilter.kind === 'tag'
              ? `「#${selectedFilter.value}」で絞り込み中`
              : selectedFilter.kind === 'emotion'
                ? `感情「${selectedFilter.value}」で絞り込み中`
              : selectedFilter.kind === 'category'
                ? `活動種別「${selectedFilter.value}」で絞り込み中`
                : selectedFilter.kind === 'subject'
                  ? `対象名「${selectedFilter.value}」で絞り込み中`
                  : `「${formatYearMonthLabel(selectedFilter.value)}」で絞り込み中`}
          </span>
          <Button type="button" variant="secondary" onClick={clearFilter}>絞り込みを解除</Button>
        </div>
      )}
      {content}
    </section>
  )
}
