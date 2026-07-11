// 検証用ダミー活動ログの一括投入・掃除スクリプト（design/08-test-policy.md の30件確認用）
// アプリ本体はOAuthのみを使う。これは開発者が手元で使う検証ツールであり、アプリの一部ではない。
//
// 使い方（app/ ディレクトリで実行）:
//   投入: SEED_HANDLE=your.handle SEED_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx node scripts/seed-logs.mjs seed [件数=35]
//   掃除: SEED_HANDLE=your.handle SEED_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx node scripts/seed-logs.mjs wipe
//
// - アプリパスワードは bsky.app の設定 > アプリパスワード で発行し、確認後に失効させること
// - 投入されるレコードは公開データになる。タイトルはすべて「ダミー活動ログ」で始まる
// - wipe は「ダミー活動ログ」で始まるタイトルのレコードだけを削除する（手動作成分は消さない）

import { AtpAgent } from '@atproto/api'

const COLLECTION = 'jp.mp0.cumulog.log'
const TITLE_PREFIX = 'ダミー活動ログ'

const handle = process.env.SEED_HANDLE
const password = process.env.SEED_APP_PASSWORD
const mode = process.argv[2]
const count = Number(process.argv[3] ?? 35)

if (!handle || !password || !['seed', 'wipe'].includes(mode)) {
  console.error('使い方: SEED_HANDLE=... SEED_APP_PASSWORD=... node scripts/seed-logs.mjs <seed|wipe> [件数]')
  process.exit(1)
}

const agent = new AtpAgent({ service: 'https://bsky.social' })
await agent.login({ identifier: handle, password })
const repo = agent.session.did
console.log(`ログイン成功: ${handle} (${repo})`)

const categories = ['アニメ', '読書', '開発', '映画', 'ゲーム']
const tagPool = ['SF', 'ファンタジー', '週末', '積読消化', 'リアタイ', '2周目']
const spoilers = ['none', 'none', 'none', 'minor', 'major']

function dateDaysAgo(days) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

if (mode === 'seed') {
  for (let i = 1; i <= count; i++) {
    const record = {
      $type: COLLECTION,
      title: `${TITLE_PREFIX} ${String(i).padStart(3, '0')}`,
      activityDate: dateDaysAgo(Math.floor(i * 1.7)),
      category: categories[i % categories.length],
      spoiler: spoilers[i % spoilers.length],
      createdAt: new Date().toISOString(),
    }
    if (i % 2 === 0) record.subject = `ダミー対象 ${Math.ceil(i / 2)}`
    if (i % 3 !== 0) record.tags = [tagPool[i % tagPool.length], tagPool[(i + 2) % tagPool.length]]
    if (i % 4 === 0) record.urls = ['https://example.com/dummy']
    if (i % 5 === 0) record.note = `スケール確認用のダミーメモ（${i}件目）。\n改行も含む。`
    await agent.com.atproto.repo.createRecord({ repo, collection: COLLECTION, record })
    process.stdout.write(`\r投入: ${i}/${count}`)
  }
  console.log('\n完了。ブラウザで一覧を再読み込みして確認してください。')
}

if (mode === 'wipe') {
  let cursor
  let deleted = 0
  do {
    const res = await agent.com.atproto.repo.listRecords({
      repo,
      collection: COLLECTION,
      limit: 100,
      ...(cursor ? { cursor } : {}),
    })
    for (const item of res.data.records) {
      if (typeof item.value.title === 'string' && item.value.title.startsWith(TITLE_PREFIX)) {
        const rkey = item.uri.split('/').pop()
        await agent.com.atproto.repo.deleteRecord({ repo, collection: COLLECTION, rkey })
        deleted++
        process.stdout.write(`\r削除: ${deleted}件`)
      }
    }
    cursor = res.data.cursor
  } while (cursor)
  console.log(`\n完了。「${TITLE_PREFIX}」で始まるレコード ${deleted}件を削除しました。`)
}
