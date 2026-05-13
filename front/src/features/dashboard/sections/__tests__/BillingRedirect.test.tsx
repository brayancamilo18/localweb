import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import BillingRedirect from '../BillingRedirect'

function AccountStub() {
  const location = useLocation()
  return (
    <div data-testid="account-page">
      tab=
      {new URLSearchParams(location.search).toString()}
    </div>
  )
}

function renderWithPath(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/dashboard/billing" element={<BillingRedirect />} />
        <Route path="/dashboard/account" element={<AccountStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('BillingRedirect', () => {
  it('redirige /dashboard/billing a /dashboard/account?tab=plan', () => {
    renderWithPath('/dashboard/billing')
    const acc = screen.getByTestId('account-page')
    expect(acc.textContent).toContain('tab=plan')
  })

  it('preserva los query params existentes y añade tab=plan si no está presente', () => {
    renderWithPath('/dashboard/billing?billing=success&session_id=cs_test_123')
    const acc = screen.getByTestId('account-page')
    expect(acc.textContent).toContain('tab=plan')
    expect(acc.textContent).toContain('billing=success')
    expect(acc.textContent).toContain('session_id=cs_test_123')
  })

  it('respeta el tab del caller si ya viene especificado', () => {
    renderWithPath('/dashboard/billing?tab=facturas')
    const acc = screen.getByTestId('account-page')
    expect(acc.textContent).toContain('tab=facturas')
    expect(acc.textContent).not.toContain('tab=plan')
  })
})
