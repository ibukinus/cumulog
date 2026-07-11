import { RefreshIcon, AlertIcon } from './icons'
import { Button } from './Button'
import styles from './ui.module.css'

export function ErrorState({ title = '活動ログを取得できませんでした', description = '通信に失敗しました。もう一度お試しください。', onRetry, retryLabel = '再試行' }: { title?: string; description?: string; onRetry: () => void; retryLabel?: string }) {
  return <section className={styles.errorState} role="alert"><AlertIcon className={styles.icon} /><h2 className={styles.errorTitle}>{title}</h2><p className={styles.errorTextBlock}>{description}</p><Button type="button" variant="secondary" onClick={onRetry}><RefreshIcon className={styles.icon} />{retryLabel}</Button></section>
}
