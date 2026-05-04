import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Schedule } from '../../../types/api'
import { isOpenNow } from '../utils/isOpenNow'

const lvSchedule: Schedule = {
  mon: { open: '09:00', close: '20:00', closed: false },
  tue: { open: '09:00', close: '20:00', closed: false },
  wed: { open: '09:00', close: '20:00', closed: false },
  thu: { open: '09:00', close: '20:00', closed: false },
  fri: { open: '09:00', close: '20:00', closed: false },
  sat: { open: '09:00', close: '20:00', closed: true },
  sun: { open: '09:00', close: '20:00', closed: true },
}

describe('isOpenNow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Lunes 10:00, negocio abre L-V 9:00-20:00 → true', () => {
    vi.setSystemTime(new Date('2026-01-05T10:00:00'))
    expect(isOpenNow(lvSchedule)).toBe(true)
  })

  it('Lunes 21:00, mismo negocio → false', () => {
    vi.setSystemTime(new Date('2026-01-05T21:00:00'))
    expect(isOpenNow(lvSchedule)).toBe(false)
  })

  it('Lunes con closed: true → false', () => {
    vi.setSystemTime(new Date('2026-01-05T10:00:00'))
    const closedMon: Schedule = { ...lvSchedule, mon: { open: '09:00', close: '20:00', closed: true } }
    expect(isOpenNow(closedMon)).toBe(false)
  })

  it('schedule null → false', () => {
    vi.setSystemTime(new Date('2026-01-05T10:00:00'))
    expect(isOpenNow(null)).toBe(false)
  })

  it('Domingo con todos los días cerrados → false', () => {
    vi.setSystemTime(new Date('2026-01-04T12:00:00'))
    const allClosed: Schedule = {
      mon: { open: '09:00', close: '20:00', closed: true },
      tue: { open: '09:00', close: '20:00', closed: true },
      wed: { open: '09:00', close: '20:00', closed: true },
      thu: { open: '09:00', close: '20:00', closed: true },
      fri: { open: '09:00', close: '20:00', closed: true },
      sat: { open: '09:00', close: '20:00', closed: true },
      sun: { open: '09:00', close: '20:00', closed: true },
    }
    expect(isOpenNow(allClosed)).toBe(false)
  })
})
