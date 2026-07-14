import type { ReactNode } from 'react'

import { effectiveSpoilerLevel, emotionLabel } from '../domain/index'
import type { CumulogLogRecord } from '../domain/types'
import { ExternalLinkIcon } from './icons'
import { SpoilerBadge } from './SpoilerBadge'
import styles from './RecordArticle.module.css'

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

function formatActivityDate(value: string): string {
  const [year, month, day] = value.split('-')
  return `${Number(year)}年${Number(month)}月${Number(day)}日`
}

/**
 * 活動ログ1件を「1件の記録として読める構成」で表示する（design/04-screens.md S4・S8）。
 * 値が未設定の任意項目は表示しない。childrenは見出し部の先頭（所有者表示等）に入る。
 */
export function RecordArticle({ record, children }: { record: CumulogLogRecord; children?: ReactNode }) {
  return <div className={styles.article}>
    <header className={styles.header}>
      {children}
      <p className={styles.meta}>
        <span className={styles.date}>{formatActivityDate(record.activityDate)}</span>
        {record.category !== undefined && <span className={styles.category}>
          <span className={styles.srOnly}>活動種別：</span>{record.category}
        </span>}
        <SpoilerBadge level={effectiveSpoilerLevel(record)} />
      </p>
      <h1 className={styles.title}>{record.title}</h1>
      {record.subject !== undefined && <p className={styles.subject}>対象：{record.subject}</p>}
    </header>
    {record.note !== undefined && <p className={styles.note}>{record.note}</p>}
    {record.tags !== undefined && record.tags.length > 0 && <ul className={styles.tags} aria-label="タグ">
      {record.tags.map((tag) => <li key={tag}>#{tag}</li>)}
    </ul>}
    {record.emotions !== undefined && record.emotions.length > 0 && <ul className={styles.emotions} aria-label="感情タグ">
      {record.emotions.map((emotion) => <li key={emotion}>感情：{emotionLabel(emotion)}</li>)}
    </ul>}
    {record.urls !== undefined && record.urls.length > 0 && <ul className={styles.urls} aria-label="外部URL">
      {record.urls.map((url) => <li key={url}>
        <ExternalLinkIcon className={styles.icon} />
        {isHttpUrl(url) ? <a href={url} target="_blank" rel="noopener noreferrer">{url}</a> : <span>{url}</span>}
      </li>)}
    </ul>}
  </div>
}
