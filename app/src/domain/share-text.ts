import type { CumulogLogRecord } from './types'

export function buildDefaultShareText(record: CumulogLogRecord, shareUrl: string): string {
  const summary = `『${record.title}』の活動ログを記録しました（活動日: ${record.activityDate}）`
  return `${summary}\n${shareUrl}`
}
