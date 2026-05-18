import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import ReferralInviteBanner from '../ReferralInviteBanner'
import { keys } from '../../../api/queryKeys'

function renderBanner(meData?: object) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (meData) {
    qc.setQueryData(keys.auth.me, meData)
  }
  return render(
    <QueryClientProvider client={qc}>
      <ReferralInviteBanner />
    </QueryClientProvider>,
  )
}

describe('ReferralInviteBanner', () => {
  it('shows invite message when referral_context is present', () => {
    renderBanner({
      user: { id: 1, name: 'Ana', email: 'a@test.com' },
      business: null,
      referral_context: { referrer_name: 'Ana Referidora', promo_code_first_free: 'REF-FREE' },
    })
    expect(screen.getByText(/Ana Referidora te ha invitado a Onez/i)).toBeInTheDocument()
    expect(screen.getByText(/Tu primer mes es gratis/i)).toBeInTheDocument()
  })

  it('renders nothing without referral_context', () => {
    const { container } = renderBanner({
      user: { id: 1, name: 'Test', email: 't@test.com' },
      business: null,
    })
    expect(container).toBeEmptyDOMElement()
  })
})
