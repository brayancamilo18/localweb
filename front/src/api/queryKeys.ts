export const keys = {
  auth: { me: ['auth', 'me'] as const },
  admin: {
    overview: ['admin', 'stats', 'overview'] as const,
    timeseries: (metric: string, range: string) => ['admin', 'stats', 'timeseries', metric, range] as const,
    sectors: ['admin', 'stats', 'sectors'] as const,
    statsTemplates: ['admin', 'stats', 'templatesList'] as const,
    businesses: (q?: Record<string, string | number | boolean | undefined>) => ['admin', 'businesses', q] as const,
    business: (id: number) => ['admin', 'business', id] as const,
    templates: ['admin', 'templates'] as const,
    users: (q?: Record<string, string | number | boolean | undefined>) => ['admin', 'users', q] as const,
    topPages: (q?: Record<string, string | number | undefined>) => ['admin', 'stats', 'top-pages', q] as const,
  },
  onboarding: { status: ['onboarding', 'status'] as const, templates: ['onboarding', 'templates'] as const },
  dashboard: {
    business: ['dashboard', 'business'] as const,
    stats: ['dashboard', 'stats'] as const,
    images: ['dashboard', 'images'] as const,
    services: ['dashboard', 'services'] as const,
    templates: ['dashboard', 'templates'] as const,
  },
  public: (subdomain: string) => ['public', subdomain] as const,
  account: {
    profile: ['account', 'profile'] as const,
    invoices: ['account', 'invoices'] as const,
    paymentMethod: ['account', 'payment-method'] as const,
    upcoming: ['account', 'upcoming'] as const,
    billingStatus: ['account', 'billing-status'] as const,
  },
  qr: {
    info: ['qr', 'info'] as const,
  },
}
