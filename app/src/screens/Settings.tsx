import { useState } from 'react'

import { useAuth } from '../app/index'
import { Button, Notice } from '../ui/index'
import styles from './Settings.module.css'

export function Settings() {
  const { session, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
    } catch {
      setSigningOut(false)
    }
  }

  if (session === null) return null

  return (
    <article>
      <h1 className={styles.title}>設定</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ログイン状態</h2>
        <div className={styles.identity}>
          <div className={styles.identityRow}>
            <span className={styles.identityLabel}>アカウント</span>
            <span className={styles.identityValue}>{session.handle ?? session.did}</span>
          </div>
          <div className={styles.identityRow}>
            <span className={styles.identityLabel}>DID</span>
            <span className={styles.identityValue}>{session.did}</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ログアウト</h2>
        <p>
          ログアウトすると、このブラウザに保存されているログインセッションが削除されます。
          活動ログの記録自体は削除されず、あなたのリポジトリに残ります。
        </p>
        <Button
          variant="secondary"
          className={styles.signOut}
          onClick={() => void handleSignOut()}
          disabled={signingOut}
        >
          {signingOut ? 'ログアウト中…' : 'ログアウト'}
        </Button>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>連携の解除</h2>
        <p>
          Cumulogはサーバー側にアカウント情報を保持していないため、Cumulog側から連携を解除する操作はありません。
          Blueskyアカウントへの認可そのものを取り消したい場合は、Bluesky（PDS）側の設定画面から行ってください。
        </p>
      </section>

      <Notice variant="info">
        <p>
          ログアウトや連携解除を行っても、これまでに保存した活動ログのレコードは削除されず、あなたのAT Protocolリポジトリに残り続けます。
          活動ログ自体を消したい場合は、各活動ログの削除操作を行ってください。
        </p>
      </Notice>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>規約・ポリシー</h2>
        <div className={styles.legalLinks}>
          <a href="/terms.html" target="_blank" rel="noopener noreferrer">利用規約</a>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>
        </div>
      </section>
    </article>
  )
}
