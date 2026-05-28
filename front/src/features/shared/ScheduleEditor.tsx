import { useMemo, useState } from 'react'
import Icon from '../../components/primitives/Icon'
import type { Schedule } from '../../types/api'
import {
  DAY_KEYS,
  DAY_LABEL_ES,
  DAY_SHORT_ES,
  DEFAULT_SCHEDULE,
  SCHEDULE_PRESETS,
  applyScheduleTemplate,
  formatScheduleHours,
  scheduleSummary,
  toScheduleMinutes,
  type DayKey,
  type SchedulePresetKind,
} from '../../lib/schedule/scheduleDefaults'
import './scheduleEditor.css'

export type ScheduleEditorProps = {
  schedule: Schedule
  onChange: (schedule: Schedule) => void
  disabled?: boolean
  title?: string
  subtitle?: string
  /** Si true, no renderiza cabecera (el padre usa `DashboardSectionHeader`). */
  hideHeader?: boolean
  showSavedStatus?: boolean
  saving?: boolean
  savedAt?: Date | null
  error?: string
}

export default function ScheduleEditor({
  schedule,
  onChange,
  disabled = false,
  title = 'Horarios',
  subtitle = 'Define cuándo está abierto tu negocio. Se guarda automáticamente al dejar de editar durante un segundo.',
  hideHeader = false,
  showSavedStatus = false,
  saving = false,
  savedAt = null,
  error,
}: ScheduleEditorProps) {
  const [activePreset, setActivePreset] = useState<SchedulePresetKind | null>('lv')
  const summary = useMemo(() => scheduleSummary(schedule), [schedule])

  const updateDay = (key: DayKey, patch: Partial<Schedule[DayKey]>) => {
    if (disabled) return
    onChange({ ...schedule, [key]: { ...schedule[key], ...patch } })
    setActivePreset(null)
  }

  const applyPreset = (kind: SchedulePresetKind) => {
    if (disabled) return
    onChange(applyScheduleTemplate(schedule, kind))
    setActivePreset(kind)
  }

  const reset = () => {
    if (disabled) return
    onChange({ ...DEFAULT_SCHEDULE })
    setActivePreset('lv')
  }

  const displaySavedAt = savedAt ?? new Date()
  const savedLabel = saving ? 'Guardando…' : 'Guardado'

  const savedStatus = showSavedStatus ? (
    <div className="lw-schedule-editor__saved" aria-live="polite">
      {!saving ? (
        <span className="lw-schedule-editor__saved-dot" aria-hidden />
      ) : (
        <Icon name="refresh" size={14} color="var(--lw-schedule-accent)" />
      )}
      <span style={{ fontWeight: 600 }}>{savedLabel}</span>
      {!saving ? (
        <span style={{ color: 'var(--lw-schedule-muted)' }}>
          ·{' '}
          {displaySavedAt.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ) : null}
    </div>
  ) : null

  return (
    <div className="lw-schedule-editor" data-tour={hideHeader ? undefined : 'horarios-main'}>
      {!hideHeader ? (
        <header className="lw-schedule-editor__header">
          <div>
            <div className="lw-schedule-editor__badge">
              <Icon name="calendar" size={12} color="var(--lw-schedule-accent)" />
              Disponibilidad
            </div>
            <h1 className="lw-schedule-editor__title">{title}</h1>
            <p className="lw-schedule-editor__subtitle">{subtitle}</p>
          </div>
          {savedStatus}
        </header>
      ) : null}

      <div className="lw-schedule-editor__stats">
        <StatCard icon="sun" label="Días abiertos" value={`${summary.openDays}/7`} />
        <StatCard icon="clock" label="Horas semana" value={summary.totalLabel} />
        <StatCard
          icon="moon"
          label="Días cerrados"
          value={`${7 - summary.openDays}`}
          accent="var(--lw-schedule-muted)"
        />
      </div>

      <section>
        <div className="lw-schedule-editor__presets-head">
          <div className="lw-schedule-editor__presets-title">
            <Icon name="sparkle" size={14} color="var(--lw-schedule-accent)" />
            Plantillas rápidas
          </div>
          <button type="button" className="lw-schedule-editor__reset" onClick={reset} disabled={disabled}>
            <Icon name="refresh" size={12} />
            Restablecer
          </button>
        </div>
        <div className="lw-schedule-editor__presets">
          {SCHEDULE_PRESETS.map((p) => {
            const active = activePreset === p.id
            return (
              <button
                key={p.id}
                type="button"
                className={`lw-schedule-editor__preset${active ? ' lw-schedule-editor__preset--active' : ''}`}
                onClick={() => applyPreset(p.id)}
                disabled={disabled}
              >
                <span className="lw-schedule-editor__preset-label">{p.label}</span>
                <span className="lw-schedule-editor__preset-sub">{p.sub}</span>
                {active ? (
                  <span className="lw-schedule-editor__preset-check" aria-hidden>
                    <Icon name="check" size={12} color="#fff" />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </section>

      <div className="lw-schedule-editor__days">
        {DAY_KEYS.map((key) => {
          const row = schedule[key]
          const isOpen = !row.closed
          const invalid = isOpen && toScheduleMinutes(row.close) <= toScheduleMinutes(row.open)
          const hoursLabel = isOpen
            ? formatScheduleHours(Math.max(0, toScheduleMinutes(row.close) - toScheduleMinutes(row.open)))
            : 'Cerrado'

          return (
            <div key={key} className="lw-schedule-editor__day">
              <div className="lw-schedule-editor__day-main">
                <div
                  className={`lw-schedule-editor__day-chip${isOpen ? ' lw-schedule-editor__day-chip--open' : ' lw-schedule-editor__day-chip--closed'}`}
                >
                  {DAY_SHORT_ES[key]}
                </div>
                <div>
                  <div
                    className={`lw-schedule-editor__day-name${isOpen ? '' : ' lw-schedule-editor__day-name--muted'}`}
                  >
                    {DAY_LABEL_ES[key]}
                  </div>
                  <div className="lw-schedule-editor__day-hours">{hoursLabel}</div>
                </div>
              </div>

              <div className="lw-schedule-editor__times">
                {isOpen ? (
                  <>
                    <TimeField
                      value={row.open}
                      disabled={disabled}
                      invalid={invalid}
                      ariaLabel={`${DAY_LABEL_ES[key]}: apertura`}
                      onChange={(open) => updateDay(key, { open })}
                    />
                    <span className="lw-schedule-editor__times-sep">a</span>
                    <TimeField
                      value={row.close}
                      disabled={disabled}
                      invalid={invalid}
                      ariaLabel={`${DAY_LABEL_ES[key]}: cierre`}
                      onChange={(close) => updateDay(key, { close })}
                    />
                  </>
                ) : (
                  <span className="lw-schedule-editor__closed-label">Sin horario</span>
                )}
              </div>

              <ScheduleToggle
                on={isOpen}
                disabled={disabled}
                onChange={(open) => updateDay(key, { closed: !open })}
              />

              {invalid ? (
                <div className="lw-schedule-editor__invalid" role="alert">
                  <Icon name="alert" size={12} color="var(--lw-schedule-danger)" />
                  El cierre debe ser posterior a la apertura
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {error ? <p className="lw-schedule-editor__error">{error}</p> : null}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent = 'var(--lw-schedule-accent)',
}: {
  icon: string
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="lw-schedule-editor__stat">
      <div
        className="lw-schedule-editor__stat-icon"
        style={{ background: `color-mix(in srgb, ${accent} 8%, transparent)`, color: accent }}
      >
        <Icon name={icon} size={16} color={accent} />
      </div>
      <div>
        <div className="lw-schedule-editor__stat-label">{label}</div>
        <div className="lw-schedule-editor__stat-value">{value}</div>
      </div>
    </div>
  )
}

function TimeField({
  value,
  onChange,
  disabled,
  invalid,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  invalid?: boolean
  ariaLabel: string
}) {
  return (
    <input
      type="time"
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`lw-schedule-editor__time${invalid ? ' lw-schedule-editor__time--invalid' : ''}`}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function ScheduleToggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className="lw-schedule-editor__toggle"
      style={{ background: on ? 'var(--lw-schedule-accent)' : 'color-mix(in srgb, var(--lw-schedule-ink) 20%, transparent)' }}
      onClick={() => onChange(!on)}
      disabled={disabled}
    >
      <span
        className="lw-schedule-editor__toggle-knob"
        style={{
          left: on ? '22px' : '2px',
          boxShadow: on ? '0 2px 6px color-mix(in srgb, var(--lw-schedule-accent-dark) 40%, transparent)' : undefined,
        }}
      />
    </button>
  )
}
