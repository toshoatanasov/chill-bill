import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// ── localStorage mock ──────────────────────────────────────────────────────
const localStorageStore = new Map<string, string>()

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => localStorageStore.set(key, value)),
  removeItem: vi.fn((key: string) => localStorageStore.delete(key)),
  clear: vi.fn(() => localStorageStore.clear()),
  get length() { return localStorageStore.size },
  key: vi.fn((index: number) => [...localStorageStore.keys()][index] ?? null),
}

vi.stubGlobal('localStorage', localStorageMock)

beforeEach(() => {
  localStorageStore.clear()
  vi.clearAllMocks()
  // Re-wire mocks after clearAllMocks (stubGlobal persists, fns need rewiring)
  localStorageMock.getItem.mockImplementation((key: string) => localStorageStore.get(key) ?? null)
  localStorageMock.setItem.mockImplementation((key: string, value: string) => localStorageStore.set(key, value))
  localStorageMock.removeItem.mockImplementation((key: string) => localStorageStore.delete(key))
  localStorageMock.clear.mockImplementation(() => localStorageStore.clear())
})

// ── matchMedia mock ────────────────────────────────────────────────────────
const mediaQueryListeners = new Map<string, Set<EventListenerOrEventListenerObject>>()

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn((event: string, listener: EventListenerOrEventListenerObject) => {
      if (!mediaQueryListeners.has(query)) mediaQueryListeners.set(query, new Set())
      mediaQueryListeners.get(query)!.add(listener)
    }),
    removeEventListener: vi.fn((event: string, listener: EventListenerOrEventListenerObject) => {
      mediaQueryListeners.get(query)?.delete(listener)
    }),
    dispatchEvent: vi.fn(),
  })),
})

// ── crypto.randomUUID mock ─────────────────────────────────────────────────
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-uuid' as `${string}-${string}-${string}-${string}-${string}`),
})
