export const keys = {
  auth: { me: ['auth', 'me'] as const },
  onboarding: { status: ['onboarding', 'status'] as const, templates: ['onboarding', 'templates'] as const },
  dashboard: {
    business: ['dashboard', 'business'] as const,
    stats: ['dashboard', 'stats'] as const,
    images: ['dashboard', 'images'] as const,
    services: ['dashboard', 'services'] as const,
    templates: ['dashboard', 'templates'] as const,
  },
  public: (subdomain: string) => ['public', subdomain] as const,
}
