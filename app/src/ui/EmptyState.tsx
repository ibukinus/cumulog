import type { ReactNode } from 'react'
import { SearchIcon } from './icons'
import styles from './ui.module.css'

export function EmptyState({ title = 'まだ活動ログがありません', description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return <section className={styles.empty} aria-label="空の状態"><SearchIcon className={styles.icon} /><h2 className={styles.emptyTitle}>{title}</h2>{description && <p className={styles.emptyText}>{description}</p>}{action}</section>
}
