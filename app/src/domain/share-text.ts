import type { CumulogLogRecord } from './types'

export function buildDefaultShareText(record: CumulogLogRecord): string {
  const summary = `『${record.title}』の活動ログを記録しました（活動日: ${record.activityDate}）`
  const firstUrl = record.urls?.[0]
  return firstUrl === undefined ? summary : `${summary}\n${firstUrl}`
}
