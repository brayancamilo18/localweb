import { describe, expect, it } from 'vitest'
import { applyScheduleTemplate, DEFAULT_SCHEDULE } from '../scheduleDefaults'

describe('applyScheduleTemplate', () => {
  it('Lun–Vie abre lun–vie 9–20 y cierra sábado y domingo', () => {
    const next = applyScheduleTemplate(DEFAULT_SCHEDULE, 'lv')
    expect(next.mon).toEqual({ open: '09:00', close: '20:00', closed: false })
    expect(next.fri.closed).toBe(false)
    expect(next.sat.closed).toBe(true)
    expect(next.sun.closed).toBe(true)
  })

  it('Lun–Sáb abre sáb 10–14 y cierra domingo', () => {
    const next = applyScheduleTemplate(DEFAULT_SCHEDULE, 'ls')
    expect(next.sat).toEqual({ open: '10:00', close: '14:00', closed: false })
    expect(next.sun.closed).toBe(true)
    expect(next.mon.open).toBe('09:00')
  })
})
