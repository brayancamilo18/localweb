import { useEffect, useRef, useState } from 'react'
import { Btn, Card, Field, Input, Switch } from '../../../components/primitives/primitives'
import type { Schedule } from '../../../types/api'
import { DEFAULT_SCHEDULE, applyScheduleTemplate } from '../../onboarding/wizard'
import { updateBusiness } from '../../../api/dashboard'
import { useDashboard } from '../context/DashboardContext'

const BORDER = 'var(--lw-border)'
const DAY_KEYS: (keyof Schedule)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABEL_ES: Record<keyof Schedule, string> = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo',
}

export default function Horarios() {
  const { business, refetch } = useDashboard()
  const [schedule, setSchedule] = useState<Schedule>(business.schedule ?? DEFAULT_SCHEDULE)
  const lastSaved = useRef(JSON.stringify(business.schedule ?? DEFAULT_SCHEDULE))
  const [saving, setSaving] = useState(false)

  const scheduleKey = JSON.stringify(business.schedule ?? null)
  useEffect(() => {
    const initial = business.schedule ?? DEFAULT_SCHEDULE
    setSchedule(initial)
    lastSaved.current = JSON.stringify(initial)
  }, [business.id, scheduleKey])

  useEffect(() => {
    const serialized = JSON.stringify(schedule)
    if (serialized === lastSaved.current) return
    const t = window.setTimeout(() => {
      setSaving(true)
      void updateBusiness({ schedule })
        .then(() => {
          lastSaved.current = serialized
          refetch()
        })
        .finally(() => setSaving(false))
    }, 1000)
    return () => window.clearTimeout(t)
  }, [schedule, refetch])

  const presets: { label: string; kind: 'lv' | 'ls' | 'all' }[] = [
    { label: 'Lun – Vie', kind: 'lv' },
    { label: 'Lun – Sáb', kind: 'ls' },
    { label: 'Todos los días', kind: 'all' },
  ]

  return (
    <div style={{ maxWidth: 640 }} data-tour="horarios-main">
      <h1 className="lw-h2" style={{ marginBottom: 8 }}>
        Horarios
      </h1>
      <p className="lw-body" style={{ marginTop: 6, marginBottom: 18 }}>
        Se guarda automáticamente al dejar de editar durante un segundo.
        {saving ? <span className="lw-small"> Guardando…</span> : null}
      </p>

      <div style={{ marginBottom: 14 }}>
        <div className="lw-small" style={{ marginBottom: 8, color: 'var(--lw-text-2)', fontWeight: 500 }}>
          Plantillas rápidas
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {presets.map((p) => (
            <Btn
              key={p.label}
              type="button"
              size="sm"
              kind="outline"
              onClick={() => setSchedule((prev) => applyScheduleTemplate(prev, p.kind))}
            >
              {p.label}
            </Btn>
          ))}
        </div>
      </div>

      <Field>
        <Card padding={0}>
          {DAY_KEYS.map((key, i) => {
            const row = schedule[key]
            const label = DAY_LABEL_ES[key]
            return (
              <div
                key={key}
                className="lw-horarios-row"
                style={{
                  borderBottom: i < DAY_KEYS.length - 1 ? `1px solid ${BORDER}` : 'none',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
                {row.closed ? (
                  <div className="lw-small" style={{ color: 'var(--lw-text-4)' }}>
                    Cerrado
                  </div>
                ) : (
                  <div className="lw-horarios-times">
                    <Input
                      type="time"
                      value={row.open}
                      fullWidth={false}
                      onChange={(e) => setSchedule((s) => ({ ...s, [key]: { ...s[key], open: e.target.value } }))}
                      style={{ height: 32, width: 110, minHeight: 32, fontSize: 13 }}
                    />
                    <span className="lw-small">a</span>
                    <Input
                      type="time"
                      value={row.close}
                      fullWidth={false}
                      onChange={(e) => setSchedule((s) => ({ ...s, [key]: { ...s[key], close: e.target.value } }))}
                      style={{ height: 32, width: 110, minHeight: 32, fontSize: 13 }}
                    />
                  </div>
                )}
                <Switch
                  checked={!row.closed}
                  size="sm"
                  onChange={(open) => setSchedule((s) => ({ ...s, [key]: { ...s[key], closed: !open } }))}
                />
              </div>
            )
          })}
        </Card>
      </Field>
    </div>
  )
}
