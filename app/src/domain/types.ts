export const CUMULOG_LOG_COLLECTION = 'jp.mp0.cumulog.log'

export type SpoilerLevel = 'none' | 'minor' | 'major'

export const TITLE_MAX_GRAPHEMES = 100
export const CATEGORY_MAX_GRAPHEMES = 30
export const SUBJECT_MAX_GRAPHEMES = 100
export const TAG_MAX_GRAPHEMES = 30
export const NOTE_MAX_GRAPHEMES = 1000
export const TAGS_MAX_ITEMS = 20
export const URLS_MAX_ITEMS = 10
export const URL_MAX_LENGTH = 2000

export interface CumulogLogRecord {
  $type: typeof CUMULOG_LOG_COLLECTION
  title: string
  activityDate: string
  category?: string
  subject?: string
  tags?: string[]
  urls?: string[]
  note?: string
  spoiler: SpoilerLevel
  createdAt: string
}
