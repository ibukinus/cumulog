import type { SpoilerLevel } from '../domain/types'
import { AlertIcon } from './icons'
import styles from './ui.module.css'

export function SpoilerBadge({ level }: { level: SpoilerLevel }) {
  if (level === 'none') return null
  const label = level === 'major' ? '重大なネタバレ' : '軽微なネタバレ'
  return <span className={[styles.badge, styles[level], level === 'major' ? styles.major : styles.minor].join(' ')}><AlertIcon className={styles.icon} />{label}</span>
}
