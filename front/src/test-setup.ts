import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/** jsdom no implementa blob URLs; polyfill estable para vi.spyOn con isolate: false. */
const urlCreateObjectURL = (() => 'blob:test-stub') as typeof URL.createObjectURL
const urlRevokeObjectURL = (() => {}) as typeof URL.revokeObjectURL

if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = urlCreateObjectURL
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = urlRevokeObjectURL
}

const memoryStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: memoryStorage,
  writable: true,
})

afterEach(() => {
  cleanup()
  URL.createObjectURL = urlCreateObjectURL
  URL.revokeObjectURL = urlRevokeObjectURL
})
