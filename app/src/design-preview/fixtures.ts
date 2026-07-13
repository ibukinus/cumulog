// design-previewモード（vite --mode design-preview）で使う表示確認用のfixture。
// 本番ビルドでは参照されない（vite.config.tsのalias参照）。
import type { LogEntry } from '../domain/logs'
import { CUMULOG_LOG_COLLECTION, type CumulogLogRecord } from '../domain/types'

export const PREVIEW_DID = 'did:plc:designpreview000000000000'
export const PREVIEW_HANDLE = 'preview.bsky.social'

const entry = (
  rkey: string,
  record: Omit<CumulogLogRecord, '$type'>,
): LogEntry => ({
  kind: 'readable',
  uri: `at://${PREVIEW_DID}/${CUMULOG_LOG_COLLECTION}/${rkey}`,
  cid: `preview-cid-${rkey}`,
  record: { $type: CUMULOG_LOG_COLLECTION, ...record },
})

export const PREVIEW_ENTRIES: LogEntry[] = [
  entry('future01', {
    title: 'ワンマンライブ「星の航海」東京公演',
    activityDate: '2026-08-22',
    category: 'ライブ',
    subject: '星野航',
    tags: ['ライブ', '遠征'],
    emotions: ['楽しみ', '高揚'],
    spoiler: 'none',
    createdAt: '2026-07-10T12:00:00.000Z',
  }),
  entry('log06', {
    title: '『流転のアルカディア』最終話まで視聴',
    activityDate: '2026-07-11',
    category: 'アニメ',
    subject: '流転のアルカディア',
    tags: ['アニメ', '完走'],
    emotions: ['感動'],
    note: '最終話の展開は賛否ありそうだけど、個人的には3話の伏線が全部回収されて大満足。作画も最後まで崩れなかった。',
    spoiler: 'major',
    createdAt: '2026-07-11T14:30:00.000Z',
  }),
  entry('log05', {
    title: '個人開発：Cumulogの共有機能をリリース',
    activityDate: '2026-07-11',
    category: '開発',
    subject: 'Cumulog',
    tags: ['個人開発', 'リリース'],
    emotions: ['達成感'],
    urls: ['https://github.com/example/cumulog/releases/tag/v0.3.0'],
    note: 'Bluesky共有と公開共有ページを実装。facetのバイトオフセット計算が一番ハマった。',
    spoiler: 'none',
    createdAt: '2026-07-11T09:15:00.000Z',
  }),
  entry('log04', {
    title: '『夜明けの図書館』読了',
    activityDate: '2026-07-05',
    category: '読書',
    subject: '夜明けの図書館',
    tags: ['読書', 'ミステリ'],
    urls: ['https://example.com/books/yoake-no-toshokan'],
    note: '中盤のどんでん返しが見事。犯人は途中で予想できたけど動機は完全に不意打ちだった。',
    spoiler: 'minor',
    createdAt: '2026-07-05T21:45:00.000Z',
  }),
  entry('log03', {
    title: '映画『ペンギン・ハイウェイ2』',
    activityDate: '2026-06-28',
    category: '映画',
    tags: ['映画'],
    spoiler: 'none',
    createdAt: '2026-06-28T18:00:00.000Z',
  }),
  entry('log02', {
    title: 'ゲーム『クロノスの砂時計』クリア',
    activityDate: '2026-06-14',
    category: 'ゲーム',
    subject: 'クロノスの砂時計',
    tags: ['ゲーム', 'RPG', 'クリア'],
    urls: [
      'https://example.com/games/chronos',
      'https://blog.example.com/chronos-review',
    ],
    note: 'プレイ時間62時間。真エンディングまで到達。戦闘システムの完成度が高く、周回する気力がまだ残っている。',
    spoiler: 'major',
    createdAt: '2026-06-14T23:10:00.000Z',
  }),
  entry('log01', {
    title: '陶芸体験ワークショップ',
    activityDate: '2026-06-01',
    spoiler: 'none',
    createdAt: '2026-06-01T15:00:00.000Z',
  }),
  // 他クライアントが作成した必須項目欠落レコード（「読み込めない活動ログ」の表示確認用）
  {
    kind: 'unreadable',
    uri: `at://${PREVIEW_DID}/${CUMULOG_LOG_COLLECTION}/broken01`,
    cid: 'preview-cid-broken01',
  },
]
