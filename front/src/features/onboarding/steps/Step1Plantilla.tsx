import { useMemo, useState } from 'react'
import { Badge, Btn, Card, Select } from '../../../components/primitives'
import type { Template } from '../../../types/api'

const SECTORS = [
  'peluqueria',
  'barberia',
  'estetica',
  'spa',
  'restaurante',
  'cafeteria',
  'bar',
  'panaderia',
  'tienda_ropa',
  'tienda_calzado',
  'floristeria',
  'farmacia',
  'clinica_dental',
  'fisioterapia',
  'gimnasio',
  'academia',
  'fontanero',
  'electricista',
  'cerrajero',
  'limpieza',
  'taller_mecanico',
  'otros',
]

type Props = {
  templates: Template[]
  value: { template_id?: number; sector?: string }
  onChange: (next: { template_id?: number; sector?: string }) => void
  onContinue?: () => void
  error?: string
}

export default function Step1Plantilla({ templates, value, onChange, onContinue, error }: Props) {
  const [localError, setLocalError] = useState('')
  const selected = useMemo(() => templates.find((t) => t.id === value.template_id) ?? null, [templates, value.template_id])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>Elige tu plantilla</h2>
      <p style={{ margin: 0, color: 'var(--lw-text-3)' }}>Selecciona un diseño y sector para personalizar tu web.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        {templates.map((template) => {
          const active = template.id === value.template_id
          return (
            <Card
              key={template.id}
              className="template-card"
              onClick={() => {
                setLocalError('')
                onChange({ ...value, template_id: template.id })
              }}
              style={{
                cursor: 'pointer',
                borderColor: active ? '#111' : 'var(--lw-border)',
                boxShadow: active ? '0 0 0 2px rgba(0,0,0,.08)' : 'var(--lw-shadow-1)',
              }}
            >
              <div data-active={active ? 'true' : 'false'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{template.name}</strong>
                {template.requires_pro ? <Badge tone="pro">PRO</Badge> : null}
              </div>
              <div
                style={{
                  marginTop: 10,
                  borderRadius: 10,
                  height: 90,
                  background: `linear-gradient(135deg, ${template.primary_color}33, ${template.primary_color}99)`,
                }}
              />
            </Card>
          )
        })}
      </div>

      <Select
        label="Sector"
        value={value.sector ?? ''}
        options={[
          { value: '', label: 'Selecciona un sector' },
          ...SECTORS.map((sector) => ({ value: sector, label: sector.replaceAll('_', ' ') })),
        ]}
        onChange={(event) => onChange({ ...value, sector: event.target.value })}
      />

      {error || localError ? <div style={{ color: 'var(--lw-danger)', fontSize: 13 }}>{error || localError}</div> : null}

      {onContinue ? (
        <Btn
          onClick={() => {
            if (!value.template_id) {
              setLocalError('Debes elegir una plantilla')
              return
            }
            onContinue()
          }}
        >
          Continuar
        </Btn>
      ) : null}

      <div style={{ marginTop: 8 }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Preview</h3>
        <Card>
          {selected ? (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--lw-border)' }}>
              <div style={{ height: 36, background: selected.primary_color }} />
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 600 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: 'var(--lw-text-3)' }}>Vista rápida de tu plantilla</div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--lw-text-3)', fontSize: 13 }}>Selecciona una plantilla para ver la miniatura.</div>
          )}
        </Card>
      </div>
    </div>
  )
}
