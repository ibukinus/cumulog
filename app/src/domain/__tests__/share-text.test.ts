import { describe, expect, it } from 'vitest'
import { buildDefaultShareText } from '../share-text'
import { CUMULOG_LOG_COLLECTION, type CumulogLogRecord } from '../types'

const record: CumulogLogRecord = {
  $type: CUMULOG_LOG_COLLECTION,
  title: '展示を見に行った',
  activityDate: '2026-07-12',
  urls: ['https://example.com/first', 'https://example.com/second'],
  note: 'これは共有しないメモ',
  tags: ['秘密のタグ'],
  spoiler: 'none',
  createdAt: '2026-07-12T00:00:00.000Z',
}
const shareUrl = 'https://cumulog.example/share/did:plc:alice/record-key'

describe('buildDefaultShareText', () => {
  it('タイトルと活動日を含める', () => {
    const text = buildDefaultShareText(record, shareUrl)
    expect(text).toContain('『展示を見に行った』')
    expect(text).toContain('活動日: 2026-07-12')
  })

  it('共有ページURLを含める', () => {
    expect(buildDefaultShareText(record, shareUrl)).toContain(shareUrl)
  })

  it('外部URLが存在しても文面に含めない', () => {
    const text = buildDefaultShareText(record, shareUrl)
    expect(text).not.toContain('https://example.com/first')
    expect(text).not.toContain('https://example.com/second')
  })

  it('本文と共有ページURLだけをこの順で含める', () => {
    expect(buildDefaultShareText(record, shareUrl).split('\n')).toEqual([
      '『展示を見に行った』の活動ログを記録しました（活動日: 2026-07-12）',
      shareUrl,
    ])
  })

  it('メモとタグを含めない', () => {
    const text = buildDefaultShareText(record, shareUrl)
    expect(text).not.toContain('これは共有しないメモ')
    expect(text).not.toContain('秘密のタグ')
  })
})
