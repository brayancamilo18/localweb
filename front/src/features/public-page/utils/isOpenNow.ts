import type { DaySchedule, Schedule } from '../../../types/api'

const JS_DAY_TO_KEY: (keyof Schedule)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((x) => Number.parseInt(x, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN
  return h * 60 + m
}

function isValidDay(d: DaySchedule | undefined): d is DaySchedule {
  return Boolean(d && typeof d.open === 'string' && typeof d.close === 'string')
}

/**
 * Whether the business is open "now" for the user's local clock,
 * mirroring typical Laravel schedule checks (per-day open/close, HH:mm).
 */
export function isOpenNow(schedule: Schedule | null): boolean {
  if (!schedule) return false

  const key = JS_DAY_TO_KEY[new Date().getDay()]
  const day = schedule[key]
  if (!isValidDay(day) || day.closed) return false

  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  const open = toMinutes(day.open)
  const close = toMinutes(day.close)
  if (Number.isNaN(open) || Number.isNaN(close)) return false

  if (close < open) {
    return cur >= open || cur <= close
  }
  return cur >= open && cur <= close
}
