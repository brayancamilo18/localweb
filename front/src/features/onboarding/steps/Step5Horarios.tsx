import { Btn, Card, Input, Toggle } from '../../../components/primitives'

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
type DaySchedule = { open: string; close: string; closed: boolean }
export type WeekSchedule = Record<DayKey, DaySchedule>

const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo',
}

type Props = {
  value: WeekSchedule
  onChange: (schedule: WeekSchedule) => void
}

function applyTemplate(value: WeekSchedule, kind: 'lv' | 'ls' | 'all'): WeekSchedule {
  const clone: WeekSchedule = JSON.parse(JSON.stringify(value))
  if (kind === 'lv') {
    ;(['mon', 'tue', 'wed', 'thu', 'fri'] as DayKey[]).forEach((day) => {
      clone[day] = { open: '09:00', close: '20:00', closed: false }
    })
    clone.sat = { ...clone.sat, closed: true }
    clone.sun = { ...clone.sun, closed: true }
  }
  if (kind === 'ls') {
    ;(['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as DayKey[]).forEach((day) => {
      clone[day] = { open: '10:00', close: '21:00', closed: false }
    })
    clone.sun = { ...clone.sun, closed: true }
  }
  if (kind === 'all') {
    ;(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as DayKey[]).forEach((day) => {
      clone[day] = { open: '10:00', close: '20:00', closed: false }
    })
  }
  return clone
}

export default function Step5Horarios({ value, onChange }: Props) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <h2 style={{ margin: 0 }}>Horarios</h2>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn kind="outline" onClick={() => onChange(applyTemplate(value, 'lv'))}>
          L-V 9:00-20:00
        </Btn>
        <Btn kind="outline" onClick={() => onChange(applyTemplate(value, 'ls'))}>
          L-S 10:00-21:00
        </Btn>
        <Btn kind="outline" onClick={() => onChange(applyTemplate(value, 'all'))}>
          Todos los días
        </Btn>
      </div>

      {Object.entries(DAY_LABELS).map(([day, label]) => {
        const key = day as DayKey
        const row = value[key]
        return (
          <Card key={day} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', alignItems: 'center', gap: 12 }}>
            <Toggle
              checked={row.closed}
              label={`${label} cerrado`}
              onChange={(checked) => onChange({ ...value, [key]: { ...row, closed: checked } })}
            />
            <Input
              label={`${label} apertura`}
              type="time"
              value={row.open}
              disabled={row.closed}
              onChange={(event) => onChange({ ...value, [key]: { ...row, open: event.target.value } })}
            />
            <Input
              label={`${label} cierre`}
              type="time"
              value={row.close}
              disabled={row.closed}
              onChange={(event) => onChange({ ...value, [key]: { ...row, close: event.target.value } })}
            />
          </Card>
        )
      })}

      <Card>
        <h3 style={{ marginTop: 0 }}>Preview</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {Object.entries(DAY_LABELS).map(([day, label]) => {
              const row = value[day as DayKey]
              return (
                <tr key={day}>
                  <td style={{ padding: '6px 0', color: 'var(--lw-text-2)' }}>{label}</td>
                  <td style={{ padding: '6px 0', textAlign: 'right' }}>{row.closed ? 'Cerrado' : `${row.open} - ${row.close}`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export { applyTemplate }
