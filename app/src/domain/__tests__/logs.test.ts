import { describe, expect, it } from 'vitest'
import {
  collectCategories,
  collectTags,
  effectiveSpoilerLevel,
  filterByCategory,
  filterByMonth,
  filterBySubject,
  filterByTag,
  parseLogRecord,
  sortLogEntries,
  type LogEntry,
} from '../logs'
import { CUMULOG_LOG_COLLECTION } from '../types'

const baseRecord = {
  $type: CUMULOG_LOG_COLLECTION,
  title: '作品を読んだ',
  activityDate: '2026-07-11',
  category: '読書',
  tags: ['小説', '日本語'],
  spoiler: 'none',
  createdAt: '2026-07-11T12:00:00.000Z',
}

const readable = (value: unknown = baseRecord): Extract<LogEntry, { kind: 'readable' }> => {
  const entry = parseLogRecord('at://did:plc:test/jp.mp0.cumulog.log/1', 'cid-1', value)
  expect(entry.kind).toBe('readable')
  if (entry.kind !== 'readable') throw new Error('テスト用レコードが読み込めない')
  return entry
}

describe('parseLogRecord', () => {
  it('正常なレコードをreadableとして返す', () => {
    expect(readable().record).toMatchObject(baseRecord)
  })

  it.each(['title', 'activityDate', 'spoiler', 'createdAt'])('必須項目 %s の欠落をunreadableとする', (key) => {
    const value = { ...baseRecord }
    delete value[key as keyof typeof value]
    expect(parseLogRecord('at://example/1', 'cid', value)).toEqual({
      kind: 'unreadable', uri: 'at://example/1', cid: 'cid',
    })
  })

  it.each(['2026-2-01', '2026/02/01', '2026-02-30'])('不正なactivityDate %sをunreadableとする', (activityDate) => {
    expect(parseLogRecord('uri', 'cid', { ...baseRecord, activityDate }).kind).toBe('unreadable')
  })

  it('不正なcreatedAtをunreadableとする', () => {
    for (const createdAt of [
      'not-a-date',
      '2026-07-11', // 日付のみ（datetime形式でない）
      '2026-02-30T00:00:00Z', // 実在しない日
      '2026-07-11T24:00:00Z', // 時刻範囲外
      '2026-07-11T12:00:00', // タイムゾーンなし
      '2026-07-11T12:00:00+99:99', // 不正なタイムゾーンオフセット
    ]) {
      expect(parseLogRecord('uri', 'cid', { ...baseRecord, createdAt }).kind).toBe('unreadable')
    }
  })

  it('正当なdatetime形式のcreatedAtをreadableとする', () => {
    for (const createdAt of [
      '2026-07-11T12:00:00Z',
      '2026-07-11T12:00:00.123Z',
      '2026-07-11T12:00:00+09:00',
    ]) {
      expect(parseLogRecord('uri', 'cid', { ...baseRecord, createdAt }).kind).toBe('readable')
    }
  })

  it('未知のspoiler値はreadableでmajorとして扱う', () => {
    const entry = readable({ ...baseRecord, spoiler: 'unknown' })
    expect(effectiveSpoilerLevel(entry.record)).toBe('major')
  })

  it('必須項目の型不一致をunreadableとする', () => {
    expect(parseLogRecord('uri', 'cid', { ...baseRecord, title: 1 }).kind).toBe('unreadable')
    expect(parseLogRecord('uri', 'cid', { ...baseRecord, spoiler: null }).kind).toBe('unreadable')
  })

  it('任意項目の型不一致は無視してreadableとする', () => {
    const entry = readable({ ...baseRecord, category: 1, tags: ['ok', 2], urls: 'url', note: null })
    expect(entry.record.category).toBeUndefined()
    expect(entry.record.tags).toBeUndefined()
    expect(entry.record.urls).toBeUndefined()
    expect(entry.record.note).toBeUndefined()
  })

  it('$type不一致や任意項目の上限超過はreadableとする', () => {
    const entry = readable({ ...baseRecord, $type: 'other.type', tags: Array.from({ length: 21 }, (_, i) => `tag-${i}`) })
    expect(entry.record.tags).toHaveLength(21)
  })
})

describe('sortLogEntries', () => {
  it('活動日、作成日時の降順で未来日を先頭にし、unreadableを末尾に置く', () => {
    const entries = [
      readable({ ...baseRecord, activityDate: '2026-07-01', createdAt: '2026-07-01T12:00:00Z' }),
      readable({ ...baseRecord, activityDate: '2099-01-01', createdAt: '2099-01-01T00:00:00Z' }),
      readable({ ...baseRecord, activityDate: '2026-07-01', createdAt: '2026-07-01T13:00:00Z' }),
      parseLogRecord('at://unreadable/1', 'cid-u', { title: 'x' }),
    ]
    const sorted = sortLogEntries(entries)
    expect(sorted[0].kind === 'readable' && sorted[0].record.activityDate).toBe('2099-01-01')
    expect(sorted[1].kind === 'readable' && sorted[1].record.createdAt).toBe('2026-07-01T13:00:00Z')
    expect(sorted[3].kind).toBe('unreadable')
  })

  it('入力配列を変更しない', () => {
    const entries = [readable({ ...baseRecord, activityDate: '2026-01-01' }), readable()]
    const original = [...entries]
    expect(sortLogEntries(entries)).not.toBe(entries)
    expect(entries).toEqual(original)
  })
})

describe('filterByTag and collectors', () => {
  it('タグは完全一致だけを返し、unreadableを除外する', () => {
    const entries = [
      readable({ ...baseRecord, tags: ['アニメ'] }),
      readable({ ...baseRecord, tags: ['アニメ映画'] }),
      parseLogRecord('unreadable', 'cid', { title: 'x' }),
    ]
    expect(filterByTag(entries, 'アニメ')).toHaveLength(1)
    expect(filterByTag(entries, 'アニメ')[0].kind).toBe('readable')
  })

  it('活動種別とタグの候補から重複を除く', () => {
    const entries = [
      readable({ ...baseRecord, category: '映画', tags: ['a', 'b'] }),
      readable({ ...baseRecord, category: '映画', tags: ['b', 'c'] }),
      readable({ ...baseRecord, category: '読書', tags: undefined }),
    ]
    expect(collectCategories(entries)).toEqual(['映画', '読書'])
    expect(collectTags(entries)).toEqual(['a', 'b', 'c'])
  })
})

describe('filterByCategory', () => {
  it('完全一致する活動種別だけを返し、未設定とunreadableを除外する', () => {
    const entries = [
      readable({ ...baseRecord, category: '読書' }),
      readable({ ...baseRecord, category: '読書会' }),
      readable({ ...baseRecord, category: undefined }),
      parseLogRecord('unreadable', 'cid', { title: 'x' }),
    ]
    expect(filterByCategory(entries, '読書')).toHaveLength(1)
    expect(filterByCategory(entries, '読書')[0].kind).toBe('readable')
  })
})

describe('filterBySubject', () => {
  it('完全一致する対象名だけを返し、未設定とunreadableを除外する', () => {
    const entries = [
      readable({ ...baseRecord, subject: '銀河鉄道の夜' }),
      readable({ ...baseRecord, subject: '銀河鉄道の夜（朗読）' }),
      readable({ ...baseRecord, subject: undefined }),
      parseLogRecord('unreadable', 'cid', { title: 'x' }),
    ]
    expect(filterBySubject(entries, '銀河鉄道の夜')).toHaveLength(1)
    expect(filterBySubject(entries, '銀河鉄道の夜')[0].kind).toBe('readable')
  })
})

describe('filterByMonth', () => {
  it('一致する年月だけを返し、他の年月とunreadableを除外する', () => {
    const entries = [
      readable({ ...baseRecord, activityDate: '2026-07-01' }),
      readable({ ...baseRecord, activityDate: '2026-07-31' }),
      readable({ ...baseRecord, activityDate: '2026-08-01' }),
      parseLogRecord('unreadable', 'cid', { title: 'x' }),
    ]
    expect(filterByMonth(entries, '2026-07')).toHaveLength(2)
    expect(filterByMonth(entries, '2026-07').every((entry) => entry.kind === 'readable')).toBe(true)
  })
})
