export const CUMULOG_LOG_COLLECTION = 'jp.mp0.cumulog.log'

export type SpoilerLevel = 'none' | 'minor' | 'major'

export const EMOTION_PRESETS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'fun', label: '楽しい' },
  { value: 'happy', label: '嬉しい' },
  { value: 'moved', label: '感動' },
  { value: 'excited', label: '興奮' },
  { value: 'anticipation', label: '楽しみ' },
  { value: 'accomplished', label: '達成感' },
  { value: 'healed', label: '癒やし' },
  { value: 'surprised', label: '驚き' },
  { value: 'bittersweet', label: '切ない' },
  { value: 'sad', label: '悲しい' },
  { value: 'tired', label: '疲れた' },
  { value: 'frustrated', label: '悔しい' },
]

export const emotionLabel = (value: string): string =>
  EMOTION_PRESETS.find((preset) => preset.value === value)?.label ?? value

export const TITLE_MAX_GRAPHEMES = 100
export const CATEGORY_MAX_GRAPHEMES = 30
export const SUBJECT_MAX_GRAPHEMES = 100
export const TAG_MAX_GRAPHEMES = 30
export const EMOTION_MAX_GRAPHEMES = 30
export const NOTE_MAX_GRAPHEMES = 1000
export const TAGS_MAX_ITEMS = 20
export const EMOTIONS_MAX_ITEMS = 5
export const URLS_MAX_ITEMS = 10
export const URL_MAX_LENGTH = 2000

// LexiconのmaxLength（UTF-8バイト長。書記素上限の10倍。lexicons/jp/mp0/cumulog/log.json と一致させること）
export const TITLE_MAX_BYTES = 1000
export const CATEGORY_MAX_BYTES = 300
export const SUBJECT_MAX_BYTES = 1000
export const TAG_MAX_BYTES = 300
export const EMOTION_MAX_BYTES = 300
export const NOTE_MAX_BYTES = 10000

export interface CumulogLogRecord {
  $type: typeof CUMULOG_LOG_COLLECTION
  title: string
  activityDate: string
  category?: string
  subject?: string
  tags?: string[]
  emotions?: string[]
  urls?: string[]
  note?: string
  spoiler: SpoilerLevel
  createdAt: string
}
