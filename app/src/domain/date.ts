/**
 * `YYYY-MM-DD` 形式かつ実在する日付かを判定する（design/02-lexicon.md）。
 * 未来日の可否は呼び出し側の関心事であり、ここでは判定しない。
 */
export function isValidActivityDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1) return false

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day <= daysInMonth[month - 1]
}

export function formatYearMonthLabel(month: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month)
  if (!match) return month
  return `${match[1]}年${Number(match[2])}月`
}
