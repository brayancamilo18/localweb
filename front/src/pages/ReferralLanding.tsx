import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { resolveReferralLandingAction } from '../lib/referralLanding'

export default function ReferralLanding() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    const action = resolveReferralLandingAction(code)

    if (action.to === 'home') {
      navigate('/', { replace: true })
      return
    }

    navigate('/register?ref=1', { replace: true })
  }, [code, navigate])

  return null
}
