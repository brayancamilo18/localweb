import { getBrandContrastWarning } from '../../lib/contrast'
import type { BrandColorTemplateMeta } from '../../api/dashboard'

type Props = {
  hex: string
  templateMeta: BrandColorTemplateMeta | null
}

export default function BrandColorContrastWarning({ hex, templateMeta }: Props) {
  const message = getBrandContrastWarning(hex, templateMeta)
  if (!message) return null

  return (
    <div
      role="status"
      style={{
        marginTop: 12,
        marginBottom: 4,
        padding: '12px 14px',
        borderRadius: 12,
        fontSize: 13,
        lineHeight: 1.45,
        fontWeight: 500,
        color: '#92400E',
        background: '#FFFBEB',
        boxShadow: 'inset 0 0 0 1px #FCD34D',
      }}
    >
      {message}
    </div>
  )
}
