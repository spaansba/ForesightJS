import "@testing-library/jest-dom"
import { afterEach, beforeEach, vi } from "vitest"

// Mock ResizeObserver
// global.ResizeObserver = class ResizeObserver {
//   observe() {}
//   unobserve() {}
//   disconnect() {}
//   constructor(callback: ResizeObserverCallback) {}
// }

// // Mock MutationObserver
// global.MutationObserver = class MutationObserver {
//   observe() {}
//   unobserve() {}
//   disconnect() {}
//   takeRecords() { return [] }
//   constructor(callback: MutationCallback) {}
// }

// Mock PositionObserver from position-observer library
const mockPositionObserver = {
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}

vi.mock("position-observer", () => ({
  PositionObserver: vi.fn(() => mockPositionObserver),
}))

// Mock @thednp/position-observer
vi.mock("@thednp/position-observer", () => ({
  PositionObserver: vi.fn(() => mockPositionObserver),
}))

// Mock tabbable
vi.mock("tabbable", () => ({
  tabbable: vi.fn(() => []),
  focusable: vi.fn(() => []),
  isTabbable: vi.fn(() => true),
  isFocusable: vi.fn(() => true),
}))

// Mock shouldRegister
vi.mock("./src/helpers/shouldRegister", () => ({
  evaluateRegistrationConditions: vi.fn(() => ({
    shouldRegister: true,
    isTouchDevice: false,
    isLimitedConnection: false,
  })),
  userUsesTouchDevice: vi.fn(() => false),
}))

// Mock performance.now for consistent timing in tests
let mockTime = 0
global.performance = {
  ...global.performance,
  now: vi.fn(() => {
    mockTime += 16 // Simulate 60fps (16ms per frame)
    return mockTime
  }),
}

// Reset mock time before each test
beforeEach(() => {
  mockTime = 0
  vi.clearAllMocks()
})

// Clean up after each test
afterEach(() => {
  // Clean up any remaining DOM elements
  document.body.innerHTML = ""
  vi.restoreAllMocks()
})

// Global test utilities
export const createMockElement = (tag = "div", attributes: Record<string, string> = {}) => {
  const element = document.createElement(tag)
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })
  return element
}

export const createMockRect = (x = 0, y = 0, width = 100, height = 100) => ({
  top: y,
  left: x,
  right: x + width,
  bottom: y + height,
  width,
  height,
  x,
  y,
  toJSON: () => ({ top: y, left: x, right: x + width, bottom: y + height, width, height, x, y }),
})

export const mockElementBounds = (element: Element, rect: Partial<DOMRect>) => {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    ...rect,
    toJSON: () => ({}),
  })
}

export const simulateMouseEvent = (
  type: string,
  element: Element | Window = window,
  options: Partial<MouseEvent> = {}
) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: 0,
    clientY: 0,
    ...options,
  })
  element.dispatchEvent(event)
  return event
}

export const simulateKeyboardEvent = (
  type: string,
  element: Element | Window = window,
  options: Partial<KeyboardEvent> = {}
) => {
  const event = new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    key: "Tab",
    ...options,
  })
  element.dispatchEvent(event)
  return event
}

export const simulateScrollEvent = (
  element: Element | Window = window,
  options: Partial<Event> = {}
) => {
  const event = new Event("scroll", {
    bubbles: true,
    cancelable: true,
    ...options,
  })
  element.dispatchEvent(event)
  return event
}

// Mock PointerEvent (jsdom doesn't fully support it)
vi.stubGlobal(
  "PointerEvent",
  class PointerEvent extends MouseEvent {
    readonly pointerId: number = 0
    readonly pointerType: string
    readonly isPrimary: boolean = true

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init)
      this.pointerType = init.pointerType || "mouse"
    }
  }
)

// Mock IntersectionObserver (jsdom doesn't support it)
vi.stubGlobal(
  "IntersectionObserver",
  class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }
)

// Mock matchMedia
global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(), // deprecated
  removeListener: vi.fn(), // deprecated
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: global.matchMedia,
})

// Mock navigator properties
Object.defineProperty(navigator, "maxTouchPoints", {
  writable: true,
  value: 0,
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
}
