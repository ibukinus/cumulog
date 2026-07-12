import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

import {
  countPostBytes,
  countPostGraphemes,
  POST_MAX_BYTES,
  POST_MAX_GRAPHEMES,
} from '../atproto/share'
import { Button } from './Button'
import { Notice } from './Notice'
import styles from './ShareDialog.module.css'

export type ShareDialogProps = {
  open: boolean
  defaultText: string
  submitting: boolean
  error?: ReactNode
  onSubmit: (text: string) => void
  onCancel: () => void
}

export function ShareDialog({ open, defaultText, submitting, error, onSubmit, onCancel }: ShareDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const titleId = useId()
  const errorId = useId()
  const [text, setText] = useState(defaultText)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setText(defaultText)
      dialog.showModal()
      textAreaRef.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [defaultText, open])

  const graphemes = countPostGraphemes(text)
  const isEmpty = text.trim().length === 0
  const isTooLong = graphemes > POST_MAX_GRAPHEMES
  const isTooLarge = countPostBytes(text) > POST_MAX_BYTES
  const isInvalid = isTooLong || isTooLarge
  const disabled = submitting || isEmpty || isInvalid

  // Escによるcancelは投稿中は無効化する（キャンセルボタンのdisabledと挙動を揃える）
  const handleDialogCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    if (submitting) {
      event.preventDefault()
      return
    }
    onCancel()
  }

  return <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onCancel={handleDialogCancel}>
    <div className={styles.body}>
      <h2 className={styles.title} id={titleId}>Blueskyで共有</h2>
      <Notice variant="public">この内容はBlueskyへの公開投稿になります。</Notice>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${titleId}-text`}>投稿文面</label>
        <textarea
          ref={textAreaRef}
          id={`${titleId}-text`}
          className={[styles.textarea, isInvalid && styles.invalid].filter(Boolean).join(' ')}
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={submitting}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={isInvalid || undefined}
        />
        <p className={[styles.counter, isInvalid && styles.overLimit].filter(Boolean).join(' ')} aria-live="polite">
          {graphemes} / {POST_MAX_GRAPHEMES}
          {isTooLong && <span>（上限を超えているため投稿できません）</span>}
          {!isTooLong && isTooLarge && <span>（データ量の上限を超えているため投稿できません。文面を短くしてください）</span>}
          {!isInvalid && isEmpty && <span>（文面を入力してください）</span>}
        </p>
      </div>
      {error && <div id={errorId} className={styles.error} role="alert">{error}</div>}
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>取り消す</Button>
        <Button type="button" onClick={() => onSubmit(text)} disabled={disabled}>{submitting ? '投稿中…' : '投稿する'}</Button>
      </div>
    </div>
  </dialog>
}
