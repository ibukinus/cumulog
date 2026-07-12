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

describe('buildDefaultShareText', () => {
  it('タイトルと活動日を含める', () => {
    const text = buildDefaultShareText(record)
    expect(text).toContain('『展示を見に行った』')
    expect(text).toContain('活動日: 2026-07-12')
  })

  it('外部URLは先頭の1件だけを改行して付加する', () => {
    expect(buildDefaultShareText(record)).toContain('\nhttps://example.com/first')
    expect(buildDefaultShareText(record)).not.toContain('https://example.com/second')
  })

  it('メモとタグを含めない', () => {
    const text = buildDefaultShareText(record)
    expect(text).not.toContain('これは共有しないメモ')
    expect(text).not.toContain('秘密のタグ')
  })
})
