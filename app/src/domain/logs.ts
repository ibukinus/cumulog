import {
  CUMULOG_LOG_COLLECTION,
  type CumulogLogRecord,
  type SpoilerLevel,
} from './types'
import { isValidActivityDate } from './date'

export type LogEntry =
  | { kind: 'readable'; uri: string; cid: string; record: CumulogLogRecord }
  | { kind: 'unreadable'; uri: string; cid: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// Lexicon datetime（RFC 3339形式）。Date.parseは日付のみの文字列や実在しない日の正規化を
// 許容してしまうため、構文と暦の実在性を明示的に検証する
const DATETIME_PATTERN =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/
const isValidDateTime = (value: string): boolean => {
  const match = DATETIME_PATTERN.exec(value)
  if (!match) return false
  if (!isValidActivityDate(match[1])) return false
  if (Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4]) > 60) return false
  // タイムゾーンオフセットの範囲も検証する（+99:99等はDate.parseがNaNとなりソートを壊す）
  if (match[5] !== undefined && (Number(match[6]) > 23 || Number(match[7]) > 59)) return false
  return Number.isFinite(Date.parse(value))
}

const optionalString = (source: Record<string, unknown>, key: string): string | undefined =>
  typeof source[key] === 'string' ? source[key] : undefined

const optionalStringArray = (
  source: Record<string, unknown>,
  key: string,
): string[] | undefined =>
  Array.isArray(source[key]) && source[key].every((item) => typeof item === 'string')
    ? source[key] as string[]
    : undefined

export const parseLogRecord = (uri: string, cid: string, value: unknown): LogEntry => {
  if (!isRecord(value)) return { kind: 'unreadable', uri, cid }

  const title = value.title
  const activityDate = value.activityDate
  const spoiler = value.spoiler
  const createdAt = value.createdAt
  if (
    typeof title !== 'string' ||
    typeof activityDate !== 'string' ||
    !isValidActivityDate(activityDate) ||
    typeof spoiler !== 'string' ||
    typeof createdAt !== 'string' ||
    !isValidDateTime(createdAt)
  ) {
    return { kind: 'unreadable', uri, cid }
  }

  const record: CumulogLogRecord = {
    $type: CUMULOG_LOG_COLLECTION,
    title,
    activityDate,
    spoiler: spoiler as SpoilerLevel,
    createdAt,
  }
  const category = optionalString(value, 'category')
  const subject = optionalString(value, 'subject')
  const tags = optionalStringArray(value, 'tags')
  const emotions = optionalStringArray(value, 'emotions')
  const urls = optionalStringArray(value, 'urls')
  const note = optionalString(value, 'note')
  if (category !== undefined) record.category = category
  if (subject !== undefined) record.subject = subject
  if (tags !== undefined) record.tags = tags
  if (emotions !== undefined) record.emotions = emotions
  if (urls !== undefined) record.urls = urls
  if (note !== undefined) record.note = note

  return { kind: 'readable', uri, cid, record }
}

export const effectiveSpoilerLevel = (record: CumulogLogRecord): SpoilerLevel =>
  record.spoiler === 'none' || record.spoiler === 'minor' || record.spoiler === 'major'
    ? record.spoiler
    : 'major'

export const sortLogEntries = (entries: LogEntry[]): LogEntry[] =>
  [...entries].sort((left, right) => {
    if (left.kind === 'unreadable') return right.kind === 'unreadable' ? 0 : 1
    if (right.kind === 'unreadable') return -1

    const activityDifference = right.record.activityDate.localeCompare(left.record.activityDate)
    if (activityDifference !== 0) return activityDifference
    return Date.parse(right.record.createdAt) - Date.parse(left.record.createdAt)
  })

export const filterByTag = (entries: LogEntry[], tag: string): LogEntry[] =>
  entries.filter(
    (entry) => entry.kind === 'readable' && entry.record.tags?.includes(tag) === true,
  )

export const filterByEmotion = (entries: LogEntry[], emotion: string): LogEntry[] =>
  entries.filter(
    (entry) => entry.kind === 'readable' && entry.record.emotions?.includes(emotion) === true,
  )

export const filterByCategory = (entries: LogEntry[], category: string): LogEntry[] =>
  entries.filter(
    (entry) => entry.kind === 'readable' && entry.record.category === category,
  )

export const filterBySubject = (entries: LogEntry[], subject: string): LogEntry[] =>
  entries.filter(
    (entry) => entry.kind === 'readable' && entry.record.subject === subject,
  )

export const filterByMonth = (entries: LogEntry[], month: string): LogEntry[] =>
  entries.filter(
    (entry) => entry.kind === 'readable' && entry.record.activityDate.slice(0, 7) === month,
  )

export const collectCategories = (entries: LogEntry[]): string[] => {
  const categories = new Set<string>()
  for (const entry of entries) {
    if (entry.kind === 'readable' && entry.record.category !== undefined) {
      categories.add(entry.record.category)
    }
  }
  return [...categories]
}

export const collectTags = (entries: LogEntry[]): string[] => {
  const tags = new Set<string>()
  for (const entry of entries) {
    if (entry.kind === 'readable' && entry.record.tags !== undefined) {
      for (const tag of entry.record.tags) tags.add(tag)
    }
  }
  return [...tags]
}

export const collectEmotions = (entries: LogEntry[]): string[] => {
  const emotions = new Set<string>()
  for (const entry of entries) {
    if (entry.kind === 'readable' && entry.record.emotions !== undefined) {
      for (const emotion of entry.record.emotions) emotions.add(emotion)
    }
  }
  return [...emotions]
}
