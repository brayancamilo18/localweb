import { Badge, Btn, Card, Input } from '../../../components/primitives'

type Props = {
  value: { address?: string; phone?: string; email?: string }
  geocodeStatus?: 'ok' | 'warning' | null
  onChange: (value: Props['value']) => void
  onSearch: () => void
}

export default function Step6Ubicacion({ value, geocodeStatus, onChange, onSearch }: Props) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0 }}>Ubicación y contacto</h2>

      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          label="Dirección"
          value={value.address ?? ''}
          onChange={(event) => onChange({ ...value, address: event.target.value })}
          style={{ flex: 1 }}
        />
        <Btn kind="outline" onClick={onSearch} style={{ marginTop: 23 }}>
          Buscar
        </Btn>
      </div>

      {geocodeStatus === 'ok' ? <Badge tone="success">Dirección encontrada</Badge> : null}
      {geocodeStatus === 'warning' ? <Badge tone="warning">No se pudo verificar la dirección</Badge> : null}

      <Input label="Teléfono" value={value.phone ?? ''} onChange={(event) => onChange({ ...value, phone: event.target.value })} />
      <Input label="Email" value={value.email ?? ''} onChange={(event) => onChange({ ...value, email: event.target.value })} />

      <Card>
        <h3 style={{ marginTop: 0 }}>Preview</h3>
        <div style={{ fontSize: 13 }}>{value.address || 'Dirección pendiente'}</div>
        <div style={{ fontSize: 13 }}>{value.phone || 'Teléfono pendiente'}</div>
        <div style={{ fontSize: 13 }}>{value.email || 'Email pendiente'}</div>
      </Card>
    </div>
  )
}
