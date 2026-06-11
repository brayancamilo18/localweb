import { Input, Textarea, Card } from '../../../components/primitives'

type Props = {
  value: {
    business_name?: string
    tagline?: string
    description?: string
  }
  onChange: (value: Props['value']) => void
}

export default function Step3About({ value, onChange }: Props) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0 }}>Cuéntanos sobre tu negocio</h2>
      <Input
        label="Nombre del negocio"
        value={value.business_name ?? ''}
        onChange={(event) => onChange({ ...value, business_name: event.target.value })}
      />
      <div>
        <Textarea
          label="Eslogan"
          maxLength={120}
          value={value.tagline ?? ''}
          onChange={(event) => onChange({ ...value, tagline: event.target.value })}
        />
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--lw-text-3)' }}>{(value.tagline ?? '').length}/120</div>
      </div>
      <div>
        <Textarea
          label="Descripción"
          rows={5}
          maxLength={500}
          value={value.description ?? ''}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
        />
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--lw-text-3)' }}>{(value.description ?? '').length}/500</div>
      </div>

      <Card>
        <h3 style={{ margin: '0 0 8px 0' }}>Preview</h3>
        <div style={{ fontWeight: 700 }}>{value.business_name || 'Tu negocio'}</div>
        <div style={{ color: 'var(--lw-text-2)', marginTop: 4 }}>{value.tagline || 'Eslogan de ejemplo'}</div>
        <p style={{ color: 'var(--lw-text-3)' }}>{value.description || 'Descripción de ejemplo para vista previa.'}</p>
      </Card>
    </div>
  )
}
