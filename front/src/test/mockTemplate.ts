import type { Template } from '../types/api'

/** Plantilla mínima válida para tests y fallbacks (alineada con Template en api.ts). */
export function mockTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 1,
    name: 'Test Template',
    slug: 'test-template',
    primary_color: '#000000',
    requires_pro: false,
    hero_photo_slots: 1,
    thumbnail_url: null,
    category: null,
    suitable_sectors: [],
    sort_order: 10,
    featured: false,
    ...overrides,
  }
}
