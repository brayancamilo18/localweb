import { useQuery } from '@tanstack/react-query'
import { Card, Icon } from '../primitives/primitives'
import { me } from '../../api/auth'
import { keys } from '../../api/queryKeys'

export default function ReferralInviteBanner() {
  const { data } = useQuery({
    queryKey: keys.auth.me,
    queryFn: me,
    staleTime: 60_000,
  })

  const referrerName = data?.referral_context?.referrer_name
  if (!referrerName) {
    return null
  }

  return (
    <Card
      padding={16}
      style={{
        marginBottom: 16,
        border: '1px solid var(--lw-success)',
        background: 'var(--lw-success-soft)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Icon name="sparkle" size={20} color="var(--lw-success)" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#14532d', lineHeight: 1.45 }}>
          {referrerName} te ha invitado a Onez. Tu primer mes es gratis.
        </p>
      </div>
    </Card>
  )
}
