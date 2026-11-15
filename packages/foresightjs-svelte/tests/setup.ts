import { afterEach, vi } from "vitest"

// jsdom does not implement these browser observers. Keep the actual manager,
// registration, snapshots, callbacks, and event emitter in integration tests.
vi.mock("position-observer", () => ({
  PositionObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
}))
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
}))

afterEach(() => {
  vi.restoreAllMocks()
})
