import type { Schedule } from '../../types/api'
import { scheduleSlotDurationMinutes, toScheduleMinutes } from './scheduleTime'

export const DEFAULT_SCHEDULE: Schedule = {
  mon: { open: '09:00', close: '20:00', closed: false },
  tue: { open: '09:00', close: '20:00', closed: false },
  wed: { open: '09:00', close: '20:00', closed: false },
  thu: { open: '09:00', close: '20:00', closed: false },
  fri: { open: '09:00', close: '20:00', closed: false },
  sat: { open: '10:00', close: '14:00', closed: true },
  sun: { open: '10:00', close: '14:00', closed: true },
}

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type DayKey = (typeof DAY_KEYS)[number]

export const DAY_LABEL_ES: Record<DayKey, string> = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo',
}

export const DAY_SHORT_ES: Record<DayKey, string> = {
  mon: 'L',
  tue: 'M',
  wed: 'X',
  thu: 'J',
  fri: 'V',
  sat: 'S',
  sun: 'D',
}

export type SchedulePresetKind = 'lv' | 'ls' | 'all'

export type SchedulePreset = {
  id: SchedulePresetKind
  label: string
  sub: string
}

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  { id: 'lv', label: 'Lun – Vie', sub: '9:00 – 20:00' },
  { id: 'ls', label: 'Lun – Sáb', sub: '9:00 – 20:00 · sáb 10–14' },
  { id: 'all', label: 'Todos los días', sub: '9:00 – 20:00' },
]

export function applyScheduleTemplate(s: Schedule, kind: SchedulePresetKind): Schedule {
  const next: Schedule = JSON.parse(JSON.stringify(s))
  if (kind === 'lv') {
    ;(['mon', 'tue', 'wed', 'thu', 'fri'] as const).forEach((d) => {
      next[d] = { open: '09:00', close: '20:00', closed: false }
    })
    next.sat = { open: '10:00', close: '14:00', closed: true }
    next.sun = { open: '10:00', close: '14:00', closed: true }
  }
  if (kind === 'ls') {
    DAY_KEYS.forEach((d) => {
      if (d === 'sun') {
        next[d] = { open: '10:00', close: '14:00', closed: true }
      } else if (d === 'sat') {
        next[d] = { open: '10:00', close: '14:00', closed: false }
      } else {
        next[d] = { open: '09:00', close: '20:00', closed: false }
      }
    })
  }
  if (kind === 'all') {
    DAY_KEYS.forEach((d) => {
      next[d] = { open: '09:00', close: '20:00', closed: false }
    })
  }
  return next
}

export function scheduleToPreviewRows(s: Schedule) {
  return DAY_KEYS.map((k) => ({
    d: DAY_LABEL_ES[k],
    o: s[k].open,
    c: s[k].close,
    closed: s[k].closed,
  }))
}

export { toScheduleMinutes } from './scheduleTime'

export function formatScheduleHours(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} h` : `${h}h ${m}m`
}

export function scheduleSummary(schedule: Schedule) {
  const open = DAY_KEYS.filter((k) => !schedule[k].closed)
  const totalMin = open.reduce(
    (acc, k) => acc + scheduleSlotDurationMinutes(schedule[k].open, schedule[k].close),
    0,
  )
  return { openDays: open.length, totalMin, totalLabel: formatScheduleHours(totalMin) }
}
