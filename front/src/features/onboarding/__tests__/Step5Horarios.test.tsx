import { fireEvent, render, screen } from '@testing-library/react'
import Step5Horarios, { type WeekSchedule } from '../steps/Step5Horarios'

function buildSchedule(): WeekSchedule {
  return {
    mon: { open: '09:00', close: '18:00', closed: false },
    tue: { open: '09:00', close: '18:00', closed: false },
    wed: { open: '09:00', close: '18:00', closed: false },
    thu: { open: '09:00', close: '18:00', closed: false },
    fri: { open: '09:00', close: '18:00', closed: false },
    sat: { open: '10:00', close: '14:00', closed: true },
    sun: { open: '10:00', close: '14:00', closed: true },
  }
}

describe('Step5Horarios', () => {
  it('toggle cerrado en Lunes deshabilita los inputs de hora', () => {
    const onChange = vi.fn()
    render(<Step5Horarios value={buildSchedule()} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Lunes cerrado/i }))
    const payload = onChange.mock.calls[0][0] as WeekSchedule
    expect(payload.mon.closed).toBe(true)
  })

  it('L-V 9:00-20:00 rellena los 5 días correctamente', () => {
    const onChange = vi.fn()
    render(<Step5Horarios value={buildSchedule()} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'L-V 9:00-20:00' }))
    const payload = onChange.mock.calls[0][0] as WeekSchedule
    expect(payload.mon.open).toBe('09:00')
    expect(payload.fri.close).toBe('20:00')
    expect(payload.mon.closed).toBe(false)
  })

  it('el domingo permanece cerrado tras aplicar la plantilla L-V', () => {
    const onChange = vi.fn()
    render(<Step5Horarios value={buildSchedule()} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'L-V 9:00-20:00' }))
    const payload = onChange.mock.calls[0][0] as WeekSchedule
    expect(payload.sun.closed).toBe(true)
  })
})
