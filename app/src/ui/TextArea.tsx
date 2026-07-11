import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import { AlertIcon } from './icons'
import styles from './ui.module.css'

export type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & { label: string; required?: boolean; error?: string; id?: string }

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea({ label, required = false, error, id, ...props }, ref) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`
  return <div className={styles.field}>
    <label className={styles.label} htmlFor={fieldId}>{label}{required && <span className={styles.required}>（必須）</span>}</label>
    <textarea ref={ref} id={fieldId} className={[styles.control, error && styles.invalid].filter(Boolean).join(' ')} required={required} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} {...props} />
    {error && <p className={styles.errorText} id={errorId}><AlertIcon className={styles.icon} />{error}</p>}
  </div>
})
