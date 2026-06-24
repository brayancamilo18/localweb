import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Schedule } from '../../types/api'
import {
  formatScheduleHoursRange,
  isOpenNow,
  isOvernightSlot,
  scheduleSlotDurationMinutes,
} from '../scheduleTime'
import type { Schedule } from '../../types/api'

describe('scheduleTime', () => {
  it('detects overnight slots', () => {
    expect(isOvernightSlot('14:00', '02:00')).toBe(true)
    expect(isOvernightSlot('09:00', '20:00')).toBe(false)
    expect(isOvernightSlot('22:00', '00:00')).toBe(true)
  })

  it('calculates overnight duration', () => {
    expect(scheduleSlotDurationMinutes('14:00', '02:00')).toBe(12 * 60)
    expect(scheduleSlotDurationMinutes('09:00', '20:00')).toBe(11 * 60)
  })

  it('formats schedule range', () => {
    expect(formatScheduleHoursRange('14:00', '02:00')).toBe('14:00 — 02:00')
    expect(formatScheduleHoursRange('09:00', '20:00')).toBe('09:00 — 20:00')
  })
})

const weekendBar: Schedule = {
  mon: { open: '09:00', close: '20:00', closed: true },
  tue: { open: '09:00', close: '20:00', closed: true },
  wed: { open: '09:00', close: '20:00', closed: true },
  thu: { open: '09:00', close: '20:00', closed: true },
  fri: { open: '14:00', close: '02:00', closed: false },
  sat: { open: '14:00', close: '02:00', closed: false },
  sun: { open: '14:00', close: '02:00', closed: false },
}

describe('isOpenNow overnight', () => {
  it('viernes 20:00 con turno 14:00–02:00 → abierto', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-19T20:00:00')) // Friday
    expect(isOpenNow(weekendBar)).toBe(true)
    vi.useRealTimers()
  })

  it('sábado 01:00 hereda cierre del viernes → abierto', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T01:00:00')) // Saturday 1am
    expect(isOpenNow(weekendBar)).toBe(true)
    vi.useRealTimers()
  })

  it('sábado 10:00 entre turnos → cerrado', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T10:00:00'))
    expect(isOpenNow(weekendBar)).toBe(false)
    vi.useRealTimers()
  })

  it('sábado 16:00 en turno de tarde → abierto', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T16:00:00'))
    expect(isOpenNow(weekendBar)).toBe(true)
    vi.useRealTimers()
  })
})
