import { useNavigate } from 'react-router-dom'

import { Button, Notice } from '../ui/index'
import styles from './Landing.module.css'

export function Landing() {
  const navigate = useNavigate()

  return (
    <article>
      <header className={styles.hero}>
        <h1 className={styles.title}>Cumulog</h1>
        <p className={styles.lead}>
          好きなことの活動ログを、短く積み重ねて自分の活動年表として残せるサービスです。
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cumulogでできること</h2>
        <p>
          ライブ、配信、読書、映画、ゲーム、展示、創作、個人開発など、好きな活動を活動日・タイトル・対象・タグ・短いメモとして記録します。
        </p>
        <p>
          長文の感想を書く場所ではありません。感想の全文はnoteやブログなど外部サービスに置き、Cumulogにはそこへのリンクと短い記録を残す使い方を想定しています。
        </p>
      </section>

      <Notice variant="public">
        <p>
          Cumulogの活動ログは、AT Protocol上の<strong>公開データ</strong>として保存されます。
          Cumulog以外のクライアントや外部サービスからも参照される可能性があります。
        </p>
      </Notice>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>対応アカウント</h2>
        <p>
          MVPでは、<strong>Bluesky公式PDS</strong>を利用しているBlueskyアカウントのみでログインできます。
          それ以外のPDSを利用しているアカウントは、現時点では利用できません。
        </p>
      </section>

      <div className={styles.legal}>
        <p className={styles.legalLead}>
          ログインを始める前に、利用規約とプライバシーポリシーをご確認ください。
        </p>
        <div className={styles.legalLinks}>
          <a href="/terms.html" target="_blank" rel="noopener noreferrer">利用規約</a>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>
        </div>
      </div>

      <Button className={styles.cta} onClick={() => navigate('/login')}>
        ログインをはじめる
      </Button>
    </article>
  )
}
