import type { ReactNode } from 'react'
import { AlertIcon, InfoIcon, LockIcon } from './icons'
import styles from './ui.module.css'

export type NoticeVariant = 'info' | 'warning' | 'error' | 'public'
export function Notice({ variant, children }: { variant: NoticeVariant; children: ReactNode }) {
  const Icon = variant === 'public' ? LockIcon : variant === 'info' ? InfoIcon : AlertIcon
  return <div className={[styles.notice, styles[variant]].join(' ')} role={variant === 'error' ? 'alert' : undefined}><Icon className={styles.icon} /><div className={styles.noticeText}>{children}</div></div>
}
