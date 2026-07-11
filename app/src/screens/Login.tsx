import { useState, type FormEvent } from 'react'

import { useAuth } from '../app/index'
import { UnsupportedPdsError } from '../atproto/oauth'
import { Button, Notice, TextField } from '../ui/index'
import styles from './Login.module.css'

type LoginError =
  | { kind: 'unsupported-pds'; serviceEndpoint: string }
  | { kind: 'other'; message: string }

export function Login() {
  const { signIn } = useAuth()
  const [handle, setHandle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<LoginError | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await signIn(handle)
      // 成功時はOAuth認可画面へのリダイレクトが発生するため、以降の状態更新は不要
    } catch (cause) {
      if (cause instanceof UnsupportedPdsError) {
        setError({ kind: 'unsupported-pds', serviceEndpoint: cause.serviceEndpoint })
      } else {
        const message = cause instanceof Error && cause.message
          ? cause.message
          : 'アカウントを確認できませんでした。'
        setError({ kind: 'other', message })
      }
      setSubmitting(false)
    }
  }

  return (
    <article>
      <h1 className={styles.title}>ログイン</h1>
      <p className={styles.lead}>
        Blueskyのhandleを入力してください。BlueskyのOAuth認可画面に進みます。
      </p>

      <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
        <TextField
          id="login-handle"
          label="handle"
          required
          placeholder="alice.bsky.social"
          autoComplete="username"
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          disabled={submitting}
          aria-describedby="login-handle-hint"
        />
        <p className={styles.hint} id="login-handle-hint">例: alice.bsky.social</p>

        {error?.kind === 'unsupported-pds' && (
          <Notice variant="error">
            <p>
              MVPではBluesky公式PDSのアカウントのみ利用できます。
            </p>
            <p>
              入力されたアカウントのPDS（{error.serviceEndpoint}）はBluesky公式PDSではないため、現時点ではCumulogを利用できません。
              Bluesky公式PDSのアカウントでログインしてください。
            </p>
          </Notice>
        )}

        {error?.kind === 'other' && (
          <Notice variant="error">
            <p>{error.message}</p>
            <p>handleのつづりを確認して、もう一度お試しください。</p>
          </Notice>
        )}

        <Button type="submit" className={styles.submit} disabled={submitting || handle.trim() === ''}>
          {submitting ? 'ログイン処理中…' : 'ログイン'}
        </Button>
      </form>

      <Notice variant="public">
        <p>
          ログイン後にCumulogへ保存する活動ログは、AT Protocol上の公開データとして保存されます。
        </p>
      </Notice>
    </article>
  )
}
