import { describe, expect, it } from 'vitest'
import { formatYearMonthLabel } from '../date'

describe('formatYearMonthLabel', () => {
  it.each([
    ['2026-07', '2026年7月'],
    ['2026-11', '2026年11月'],
  ])('%sを年月ラベルに整形する', (month, expected) => {
    expect(formatYearMonthLabel(month)).toBe(expected)
  })

  it('不正な形式はそのまま返す', () => {
    expect(formatYearMonthLabel('foo')).toBe('foo')
  })
})
