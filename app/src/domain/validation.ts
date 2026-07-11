import type { CumulogLogRecord, SpoilerLevel } from './types'
import { isValidActivityDate } from './date'
import {
  CATEGORY_MAX_GRAPHEMES,
  NOTE_MAX_GRAPHEMES,
  SUBJECT_MAX_GRAPHEMES,
  TAGS_MAX_ITEMS,
  TAG_MAX_GRAPHEMES,
  TITLE_MAX_GRAPHEMES,
  URLS_MAX_ITEMS,
  URL_MAX_LENGTH,
} from './types'

export interface ActivityLogFormInput {
  title: string
  activityDate: string
  category: string
  subject: string
  tags: string[]
  urls: string[]
  note: string
  spoiler?: SpoilerLevel
}

export type ActivityLogRecordInput = Omit<CumulogLogRecord, '$type' | 'createdAt'>

export interface FieldError {
  field: keyof ActivityLogFormInput
  message: string
}

export type ValidationResult =
  | { ok: true; value: ActivityLogRecordInput }
  | { ok: false; errors: FieldError[] }

// oxlint-disable-next-line no-control-regex -- 保存前にC0/C1制御文字を除去するための意図的な指定
const controlCharactersExceptWhitespace = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u0080-\u009F]/g
const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

function normalizeText(value: string): string {
  return value.replace(controlCharactersExceptWhitespace, '').trim()
}

function graphemeLength(value: string): number {
  return Array.from(graphemeSegmenter.segment(value)).length
}

function addOptionalText(
  record: ActivityLogRecordInput,
  field: 'category' | 'subject' | 'note',
  value: string,
): void {
  if (value !== '') record[field] = value
}

export function validateActivityLog(input: ActivityLogFormInput): ValidationResult {
  const errors: FieldError[] = []
  const title = normalizeText(input.title)
  const category = normalizeText(input.category)
  const subject = normalizeText(input.subject)
  const note = normalizeText(input.note)
  const tags = input.tags.map(normalizeText).filter((tag) => tag !== '')
  const urls = input.urls.map((url) => url.trim()).filter((url) => url !== '')

  if (title === '') {
    errors.push({ field: 'title', message: 'タイトルを入力してください。' })
  } else if (graphemeLength(title) > TITLE_MAX_GRAPHEMES) {
    errors.push({ field: 'title', message: `タイトルは${TITLE_MAX_GRAPHEMES}文字以内で入力してください。` })
  }

  if (!isValidActivityDate(input.activityDate)) {
    errors.push({ field: 'activityDate', message: '活動日をYYYY-MM-DD形式の実在する日付で入力してください。' })
  }

  const validSpoilerLevels: readonly string[] = ['none', 'minor', 'major']
  if (input.spoiler !== undefined && !validSpoilerLevels.includes(input.spoiler)) {
    errors.push({ field: 'spoiler', message: 'ネタバレの設定を選び直してください。' })
  }

  const optionalFields: Array<['category' | 'subject' | 'note', string, number, string]> = [
    ['category', category, CATEGORY_MAX_GRAPHEMES, '活動種別'],
    ['subject', subject, SUBJECT_MAX_GRAPHEMES, '対象名'],
    ['note', note, NOTE_MAX_GRAPHEMES, 'メモ'],
  ]
  for (const [field, value, max, label] of optionalFields) {
    if (graphemeLength(value) > max) {
      errors.push({ field, message: `${label}は${max}文字以内で入力してください。` })
    }
  }

  const duplicateTag = tags.find((tag, index) => tags.indexOf(tag) !== index)
  if (duplicateTag !== undefined) {
    errors.push({ field: 'tags', message: 'タグに重複があります。異なるタグを入力してください。' })
  }
  if (tags.length > TAGS_MAX_ITEMS) {
    errors.push({ field: 'tags', message: `タグは${TAGS_MAX_ITEMS}件以内にしてください。` })
  }
  if (tags.some((tag) => graphemeLength(tag) > TAG_MAX_GRAPHEMES)) {
    errors.push({ field: 'tags', message: `各タグは${TAG_MAX_GRAPHEMES}文字以内で入力してください。` })
  }

  if (urls.length > URLS_MAX_ITEMS) {
    errors.push({ field: 'urls', message: `外部URLは${URLS_MAX_ITEMS}件以内にしてください。` })
  }
  if (urls.some((url) => url.length > URL_MAX_LENGTH)) {
    errors.push({ field: 'urls', message: `外部URLは1件${URL_MAX_LENGTH}文字以内で入力してください。` })
  }
  if (urls.some((url) => {
    try {
      const parsed = new URL(url)
      return parsed.protocol !== 'http:' && parsed.protocol !== 'https:'
    } catch {
      return true
    }
  })) {
    errors.push({ field: 'urls', message: '外部URLはhttpまたはhttpsの正しいURLを入力してください。' })
  }

  if (errors.length > 0) return { ok: false, errors }

  const value: ActivityLogRecordInput = {
    title,
    activityDate: input.activityDate,
    spoiler: input.spoiler ?? 'none',
  }
  addOptionalText(value, 'category', category)
  addOptionalText(value, 'subject', subject)
  addOptionalText(value, 'note', note)
  if (tags.length > 0) value.tags = tags
  if (urls.length > 0) value.urls = urls
  return { ok: true, value }
}
