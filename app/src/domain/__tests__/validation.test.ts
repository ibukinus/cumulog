import { describe, expect, it } from 'vitest'
import { validateActivityLog, type ActivityLogFormInput } from '../validation'

const baseInput = (): ActivityLogFormInput => ({
  title: '活動',
  activityDate: '2026-07-11',
  category: '',
  subject: '',
  tags: [],
  urls: [],
  note: '',
})

describe('validateActivityLog', () => {
  it('タイトルを必須検証し、トリムする', () => {
    expect(validateActivityLog({ ...baseInput(), title: '   ' }).ok).toBe(false)
    expect(validateActivityLog({ ...baseInput(), title: '  活動  ' })).toMatchObject({ ok: true, value: { title: '活動' } })
  })

  it('書記素数を検証し、結合絵文字を1書記素として扱う', () => {
    expect(validateActivityLog({ ...baseInput(), title: 'あ'.repeat(100) }).ok).toBe(true)
    expect(validateActivityLog({ ...baseInput(), title: 'あ'.repeat(101) }).ok).toBe(false)
    expect(validateActivityLog({ ...baseInput(), title: '👨‍👩‍👧‍👦'.repeat(100) }).ok).toBe(true)
  })

  it('活動日の形式と実在性を検証し、未来日を許可する', () => {
    for (const activityDate of ['2026/07/11', '20260711', '2026-02-30', '2026-13-01']) {
      expect(validateActivityLog({ ...baseInput(), activityDate }).ok).toBe(false)
    }
    expect(validateActivityLog({ ...baseInput(), activityDate: '2099-12-31' }).ok).toBe(true)
  })

  it('タグを正規化し、空要素を除去して重複・件数を検証する', () => {
    expect(validateActivityLog({ ...baseInput(), tags: [' foo ', '', '  ', 'bar'] })).toMatchObject({ ok: true, value: { tags: ['foo', 'bar'] } })
    expect(validateActivityLog({ ...baseInput(), tags: ['foo', ' foo '] }).ok).toBe(false)
    expect(validateActivityLog({ ...baseInput(), tags: Array.from({ length: 21 }, (_, i) => String(i)) }).ok).toBe(false)
  })

  it('http/https URLのみ受け付け、件数を検証する', () => {
    expect(validateActivityLog({ ...baseInput(), urls: ['http://example.com', 'https://example.com/path'] }).ok).toBe(true)
    for (const url of ['ftp://example.com', 'javascript:alert(1)', 'not a url']) {
      expect(validateActivityLog({ ...baseInput(), urls: [url] }).ok).toBe(false)
    }
    expect(validateActivityLog({ ...baseInput(), urls: Array.from({ length: 11 }, (_, i) => `https://example.com/${i}`) }).ok).toBe(false)
  })

  it('書記素数の上限内でもUTF-8バイト上限を超える入力はエラーとする', () => {
    // 家族絵文字は1書記素だが25バイト。50個で1250バイト > タイトル上限1000バイト
    const emoji = '👨‍👩‍👧‍👦'.repeat(50)
    const result = validateActivityLog({ ...baseInput(), title: emoji })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0].field).toBe('title')
  })

  it('URLの前後空白をトリムして保存し、空欄のURL入力は除去する', () => {
    const result = validateActivityLog({ ...baseInput(), urls: [' https://example.com ', '', '  '] })
    expect(result).toMatchObject({ ok: true, value: { urls: ['https://example.com'] } })
    const empty = validateActivityLog({ ...baseInput(), urls: ['', ' '] })
    expect(empty.ok).toBe(true)
    if (empty.ok) expect(empty.value).not.toHaveProperty('urls')
  })

  it('制御文字を除去し、メモの改行とタブは保持する', () => {
    const result = validateActivityLog({ ...baseInput(), title: ' A\u0000B ', note: ' A\n\t\u0001B ' })
    expect(result).toMatchObject({ ok: true, value: { title: 'AB', note: 'A\n\tB' } })
  })

  it('spoiler未指定と空の任意項目を正規化する', () => {
    const result = validateActivityLog({ ...baseInput(), category: ' ', subject: '', note: '' })
    expect(result).toMatchObject({ ok: true, value: { spoiler: 'none' } })
    if (result.ok) {
      expect(result.value).not.toHaveProperty('category')
      expect(result.value).not.toHaveProperty('subject')
      expect(result.value).not.toHaveProperty('note')
    }
  })
})
