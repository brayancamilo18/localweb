import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Btn, Card } from '../../../components/primitives'

type Props = {
  subdomain?: string
}

export default function Step8Publicar({ subdomain }: Props) {
  const navigate = useNavigate()
  const publicUrl = useMemo(() => `${subdomain || 'negocio'}.dominio.com`, [subdomain])

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <style>
        {`.confetti{position:relative;overflow:hidden}.confetti:before,.confetti:after{content:'';position:absolute;top:-20px;width:8px;height:14px;background:#22c55e;animation:fall 1.6s linear infinite}.confetti:after{left:70%;background:#f59e0b;animation-delay:.4s}@keyframes fall{to{transform:translateY(180px) rotate(220deg)}}`}
      </style>
      <h2 style={{ margin: 0 }}>¡Tu página está lista!</h2>

      <Card className="confetti">
        <div style={{ fontSize: 13, color: 'var(--lw-text-3)' }}>URL pública</div>
        <div style={{ fontWeight: 700, marginTop: 6 }}>{publicUrl}</div>
      </Card>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn kind="outline" onClick={() => navigator.clipboard.writeText(`https://${publicUrl}`)}>
          Copiar URL
        </Btn>
        <Btn kind="outline" onClick={() => window.open(`https://${publicUrl}`, '_blank')}>
          Ver mi página
        </Btn>
        <Btn onClick={() => navigate('/dashboard')}>Ir al dashboard</Btn>
      </div>
    </div>
  )
}
