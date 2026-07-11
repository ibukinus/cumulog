import { useEffect, useId, useRef, type ReactNode } from 'react'
import { AlertIcon } from './icons'
import { Button, type ButtonVariant } from './Button'
import styles from './ui.module.css'

export type ConfirmDialogProps = { open: boolean; title: string; description: ReactNode; confirmLabel: string; cancelLabel?: string; confirmVariant?: ButtonVariant; onConfirm: () => void; onCancel: () => void }

export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = '取り消す', confirmVariant = 'danger', onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onCancel={onCancel}>
    <div className={styles.dialogBody}>
      <AlertIcon className={styles.icon} />
      <h2 className={styles.dialogTitle} id={titleId}>{title}</h2>
      <div>{description}</div>
      <div className={styles.dialogActions}>
        <Button type="button" variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
        <Button type="button" variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  </dialog>
}
