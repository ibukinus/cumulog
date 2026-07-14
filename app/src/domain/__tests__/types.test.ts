import { describe, expect, it } from 'vitest'

import { emotionLabel } from '../types'

describe('emotionLabel', () => {
  it('プリセット値を日本語ラベルに変換する', () => {
    expect(emotionLabel('fun')).toBe('楽しい')
  })

  it('プリセット外の値はそのまま返す', () => {
    expect(emotionLabel('legacy-emotion')).toBe('legacy-emotion')
  })
})
