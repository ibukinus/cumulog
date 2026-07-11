import { useEffect, useState } from 'react'
import { CheckIcon } from './icons'
import styles from './ui.module.css'

export type ToastProps = { message: string; duration?: number; onClose?: () => void }

export function Toast({ message, duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => { setVisible(false); onClose?.() }, duration)
    return () => window.clearTimeout(timer)
  }, [duration, onClose])
  if (!visible) return null
  return <div className={styles.toast} role="status" aria-live="polite"><CheckIcon className={styles.icon} />{message}</div>
}
