import type { DaySchedule, Schedule } from '../../types/api'

const JS_DAY_TO_KEY: (keyof Schedule)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function toScheduleMinutes(t: string): number {
  const [h, m] = t.split(':').map((x) => Number.parseInt(x, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN
  return h * 60 + m
}

/** Cierre en madrugada del día siguiente (p. ej. 14:00 → 02:00). */
export function isOvernightSlot(open: string, close: string): boolean {
  const o = toScheduleMinutes(open)
  const c = toScheduleMinutes(close)
  if (Number.isNaN(o) || Number.isNaN(c)) return false
  return c <= o
}

export function scheduleSlotDurationMinutes(open: string, close: string): number {
  const o = toScheduleMinutes(open)
  const c = toScheduleMinutes(close)
  if (Number.isNaN(o) || Number.isNaN(c)) return 0
  if (isOvernightSlot(open, close)) {
    return 24 * 60 - o + c
  }
  return Math.max(0, c - o)
}

export function formatScheduleHoursRange(open: string, close: string): string {
  return `${open} — ${close}`
}

function isDayScheduleOpenAt(row: DaySchedule | undefined, cur: number): boolean {
  if (!row || row.closed) return false
  const open = toScheduleMinutes(row.open)
  const close = toScheduleMinutes(row.close)
  if (Number.isNaN(open) || Number.isNaN(close)) return false
  if (isOvernightSlot(row.open, row.close)) {
    return cur >= open || cur <= close
  }
  return cur >= open && cur <= close
}

/**
 * ¿Abierto ahora? Respeta turnos nocturnos y la madrugada heredada del día anterior.
 */
export function isOpenNow(schedule: Schedule | null): boolean {
  if (!schedule) return false

  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  const todayKey = JS_DAY_TO_KEY[now.getDay()]
  const yesterdayKey = JS_DAY_TO_KEY[(now.getDay() + 6) % 7]

  const yesterday = schedule[yesterdayKey]
  if (
    yesterday &&
    !yesterday.closed &&
    isOvernightSlot(yesterday.open, yesterday.close)
  ) {
    const close = toScheduleMinutes(yesterday.close)
    if (!Number.isNaN(close) && cur <= close) {
      return true
    }
  }

  return isDayScheduleOpenAt(schedule[todayKey], cur)
}
