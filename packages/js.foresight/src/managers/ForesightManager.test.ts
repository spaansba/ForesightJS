import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { ForesightManager } from "./ForesightManager"
import { hasConnectionLimitations } from "../helpers/shouldRegister"
import type {
  ForesightElement,
  ForesightElementInternal,
  ForesightElementState,
  ForesightRegisterOptions,
} from "../types/types"

// Mock position-observer before importing ForesightManager
vi.mock("position-observer", () => {
  class MockPositionObserver {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  }

  return {
    PositionObserver: MockPositionObserver,
    PositionObserverEntry: class {},
  }
})

// Helper to reset the singleton between tests
const resetForesightManager = () => {
  // Access private static property to reset singleton
  // @ts-expect-error - accessing private static for test reset
  ForesightManager.manager = undefined
}

const getEntry = (
  manager: ForesightManager,
  element: ForesightElement
): ForesightElementInternal => {
  // @ts-expect-error - accessing private map for tests
  const entry = manager.elementEntries.get(element) as ForesightElementInternal | undefined
  if (!entry) {
    throw new Error("Element not registered")
  }

  return entry
}

const getScannableElements = (manager: ForesightManager): Set<ForesightElementInternal> =>
  // @ts-expect-error - accessing private set for tests
  manager.scannableElements as Set<ForesightElementInternal>

const fire = (
  manager: ForesightManager,
  entry: ForesightElementInternal,
  hitType: { kind: "mouse"; subType: "hover" | "trajectory" } = {
    kind: "mouse",
    subType: "hover",
  }
) => {
  // @ts-expect-error - accessing private method for tests
  manager.callCallback(entry, hitType)
}

const createMockElement = (id = "test-element"): ForesightElement => {
  const element = document.createElement("div")
  element.id = id
  document.body.appendChild(element)

  element.getBoundingClientRect = vi.fn(() => ({
    top: 100,
    left: 100,
    right: 200,
    bottom: 200,
    width: 100,
    height: 100,
    x: 100,
    y: 100,
    toJSON: () => ({}),
  }))

  return element
}

const expectState = (
  state: ForesightElementState,
  expected: { isPredicted: boolean; isCallbackRunning: boolean; isActive: boolean }
) => {
  expect(state.isPredicted).toBe(expected.isPredicted)
  expect(state.isCallbackRunning).toBe(expected.isCallbackRunning)
}

const runReactivationCycle = async (
  manager: ForesightManager,
  entry: ForesightElementInternal,
  reactivateAfter: number
) => {
  fire(manager, entry)
  await vi.advanceTimersByTimeAsync(0)
  expectState(entry.state, { isPredicted: true, isCallbackRunning: false, isActive: false })

  await vi.advanceTimersByTimeAsync(reactivateAfter)
  expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: true })
}

const setupBasicTest = (
  registerOpts: Partial<Omit<ForesightRegisterOptions, "element" | "callback">> = {}
) => {
  const manager = ForesightManager.initialize()
  const element = createMockElement()
  const result = manager.register({ element, callback: vi.fn(), ...registerOpts })
  const entry = getEntry(manager, element)

  return { manager, element, entry, result }
}

const setupReactivationTest = (reactivateAfter: number = 5000) => {
  const manager = ForesightManager.initialize()
  const element = createMockElement()

  manager.register({ element, callback: vi.fn(), reactivateAfter })
  const entry = getEntry(manager, element)

  return { manager, element, entry }
}

const setupReactivationAfterFire = async (reactivateAfter: number) => {
  const result = setupReactivationTest(reactivateAfter)
  // Fire callback to start the reactivation timer
  fire(result.manager, result.entry)
  await vi.advanceTimersByTimeAsync(0)
  expect(result.entry.state.isActive).toBe(false)

  return result
}

const setupDeferredCallbackTest = (reactivateAfter: number = Infinity) => {
  const manager = ForesightManager.initialize()
  const element = createMockElement()
  let resolveCallback!: () => void
  const callback = vi.fn(() => new Promise<void>(resolve => (resolveCallback = resolve)))

  manager.register({ element, callback, reactivateAfter })
  const entry = getEntry(manager, element)

  return { manager, element, entry, callback, resolve: () => resolveCallback() }
}

const expectPredictorNotLoaded = async (
  predictor: "tab" | "scroll",
  initSettings: Parameters<typeof ForesightManager.initialize>[0]
) => {
  vi.useRealTimers()
  const manager = ForesightManager.initialize(initSettings)
  const element = createMockElement()

  manager.register({ element, callback: vi.fn() })

  // Wait for handler to load first
  await vi.waitFor(() => {
    expect(manager.getManagerData.loadedModules.desktopHandler).toBe(true)
  })

  // Predictor should still be false
  expect(manager.getManagerData.loadedModules.predictors[predictor]).toBe(false)
  vi.useFakeTimers()
}

const createMockNodeList = (count: number): NodeListOf<ForesightElement> => {
  const container = document.createElement("div")
  document.body.appendChild(container)

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div")
    el.classList.add("foresight-item")
    el.id = `item-${i}`
    el.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      left: 100,
      right: 200,
      bottom: 200,
      width: 100,
      height: 100,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    }))
    container.appendChild(el)
  }

  return container.querySelectorAll(".foresight-item")
}

describe("ForesightManager", () => {
  beforeEach(() => {
    resetForesightManager()
    vi.useFakeTimers()
    document.body.innerHTML = ""
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe("Singleton Pattern", () => {
    it("should create a singleton instance", () => {
      const instance1 = ForesightManager.initialize()
      const instance2 = ForesightManager.initialize()

      expect(instance1).toBe(instance2)
    })

    it("should return same instance via static getter", () => {
      const instance1 = ForesightManager.instance
      const instance2 = ForesightManager.instance

      expect(instance1).toBe(instance2)
    })

    it("should report initialization status correctly", () => {
      expect(ForesightManager.isInitiated).toBe(false)

      ForesightManager.initialize()

      expect(ForesightManager.isInitiated).toBe(true)
    })

    it("should accept initial settings on first initialization", () => {
      const manager = ForesightManager.initialize({
        trajectoryPredictionTime: 150,
        enableMousePrediction: false,
      })

      const data = manager.getManagerData
      expect(data.globalSettings.trajectoryPredictionTime).toBe(150)
      expect(data.globalSettings.enableMousePrediction).toBe(false)
    })

    it("should ignore settings on subsequent initialization calls", () => {
      ForesightManager.initialize({ trajectoryPredictionTime: 150 })
      ForesightManager.initialize({ trajectoryPredictionTime: 50 })

      const data = ForesightManager.instance.getManagerData
      expect(data.globalSettings.trajectoryPredictionTime).toBe(150)
    })
  })

  describe("Element Registration", () => {
    it("should register an element successfully", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const callback = vi.fn()

      const result = manager.register({ element, callback, name: "test" })

      expect(result.isRegistered).toBe(true)
      expect(manager.registeredElements.size).toBe(1)
      expect(manager.registeredElements.has(element)).toBe(true)
    })

    it("should assign unique IDs to registered elements", () => {
      const manager = ForesightManager.initialize()
      const element1 = createMockElement("el1")
      const element2 = createMockElement("el2")

      manager.register({ element: element1, callback: vi.fn() })
      manager.register({ element: element2, callback: vi.fn() })

      const state1 = manager.registeredElements.get(element1)
      const state2 = manager.registeredElements.get(element2)

      expect(state1?.id).not.toBe(state2?.id)
      expect(state1?.id).toMatch(/^foresight-\d+$/)
    })

    it("should increment registerCount on duplicate registration", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })
      const result = manager.register({ element, callback: vi.fn() })

      expect(result.registerCount).toBe(2)
      expect(manager.registeredElements.get(element)?.registerCount).toBe(2)
    })

    it("should use element id as name when name not provided", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement("my-button")

      manager.register({ element, callback: vi.fn() })

      expect(manager.registeredElements.get(element)?.name).toBe("my-button")
    })

    it("should use provided name over element id", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement("my-button")

      manager.register({ element, callback: vi.fn(), name: "Custom Name" })

      expect(manager.registeredElements.get(element)?.name).toBe("Custom Name")
    })

    it("should store metadata when provided", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const meta = { route: "/dashboard", priority: 1 }

      manager.register({ element, callback: vi.fn(), meta })

      expect(manager.registeredElements.get(element)?.meta).toEqual(meta)
    })

    it("should apply custom hitSlop when provided", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({
        element,
        callback: vi.fn(),
        hitSlop: { top: 10, left: 20, right: 30, bottom: 40 },
      })

      const state = manager.registeredElements.get(element)
      expect(state?.hitSlop).toEqual({
        top: 10,
        left: 20,
        right: 30,
        bottom: 40,
      })
    })

    it("should apply numeric hitSlop to all sides", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), hitSlop: 15 })

      const state = manager.registeredElements.get(element)
      expect(state?.hitSlop).toEqual({
        top: 15,
        left: 15,
        right: 15,
        bottom: 15,
      })
    })

    it("should emit elementRegistered event", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const listener = vi.fn()

      manager.addEventListener("elementRegistered", listener)
      manager.register({ element, callback: vi.fn(), name: "test" })

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "elementRegistered",
          state: expect.objectContaining({ name: "test" }),
        })
      )
    })
  })

  describe("Element Unregistration", () => {
    it("should unregister an element", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })
      expect(manager.registeredElements.size).toBe(1)

      manager.unregister(element)
      expect(manager.registeredElements.size).toBe(0)
    })

    it("should handle unregistering non-existent element gracefully", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      expect(() => manager.unregister(element)).not.toThrow()
    })

    it("should emit elementUnregistered event with reason", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const listener = vi.fn()

      manager.register({ element, callback: vi.fn(), name: "test" })
      manager.addEventListener("elementUnregistered", listener)
      manager.unregister(element, "apiCall")

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "elementUnregistered",
          unregisterReason: "apiCall",
        })
      )
    })

    it("should indicate when last element is unregistered", () => {
      const { manager, element } = setupBasicTest()
      const listener = vi.fn()

      manager.addEventListener("elementUnregistered", listener)
      manager.unregister(element)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          wasLastRegisteredElement: true,
        })
      )
    })

    it("should remove element state on unregister", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })

      // The element should be active initially (visible, active, not running)
      const stateBefore = manager.registeredElements.get(element)
      expect(stateBefore?.isActive).toBe(true)

      manager.unregister(element)

      // After unregister, element should not exist
      expect(manager.registeredElements.has(element)).toBe(false)
    })
  })

  describe("Data attribute mirroring (setDataAttributes global setting)", () => {
    it("does not touch the DOM when disabled globally", async () => {
      ForesightManager.initialize({ setDataAttributes: false })
      const { manager, element, entry } = setupBasicTest()

      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)

      expect(element.hasAttribute("data-predicted")).toBe(false)
      expect(element.hasAttribute("data-callback-running")).toBe(false)
      expect(element.hasAttribute("data-status")).toBe(false)
      expect(element.hasAttribute("data-active")).toBe(false)
    })

    it("mirrors state onto data-* attributes by default", async () => {
      const { manager, element, entry } = setupBasicTest()

      // Fresh registration: active and eligible to fire, not yet predicted.
      expect(element.hasAttribute("data-active")).toBe(true)
      expect(element.hasAttribute("data-predicted")).toBe(false)

      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)

      // After firing it has predicted + completed, and (reactivateAfter is
      // Infinity by default) is no longer active.
      expect(element.hasAttribute("data-predicted")).toBe(true)
      expect(element.getAttribute("data-status")).toBe("success")
      expect(element.hasAttribute("data-active")).toBe(false)
    })

    it("removes all data-* attributes on unregister", async () => {
      const { manager, element, entry } = setupBasicTest()

      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      expect(element.hasAttribute("data-predicted")).toBe(true)

      manager.unregister(element)

      expect(element.hasAttribute("data-active")).toBe(false)
      expect(element.hasAttribute("data-predicted")).toBe(false)
      expect(element.hasAttribute("data-status")).toBe(false)
    })

    it("applies and removes attributes on all elements when toggled at runtime", async () => {
      const { manager, element, entry } = setupBasicTest()

      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      expect(element.hasAttribute("data-predicted")).toBe(true)

      // Turning it off clears every mirrored attribute on registered elements.
      manager.alterGlobalSettings({ setDataAttributes: false })
      expect(element.hasAttribute("data-predicted")).toBe(false)

      // Turning it back on re-applies the current state.
      manager.alterGlobalSettings({ setDataAttributes: true })
      expect(element.hasAttribute("data-predicted")).toBe(true)
    })
  })

  describe("Event System", () => {
    it("should add and invoke event listeners", () => {
      const manager = ForesightManager.initialize()
      const listener = vi.fn()

      manager.addEventListener("elementRegistered", listener)
      manager.register({ element: createMockElement(), callback: vi.fn() })

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it("should remove event listeners", () => {
      const manager = ForesightManager.initialize()
      const listener = vi.fn()

      manager.addEventListener("elementRegistered", listener)
      manager.removeEventListener("elementRegistered", listener)
      manager.register({ element: createMockElement(), callback: vi.fn() })

      expect(listener).not.toHaveBeenCalled()
    })

    it("should support AbortSignal for listener cleanup", () => {
      const manager = ForesightManager.initialize()
      const listener = vi.fn()
      const controller = new AbortController()

      manager.addEventListener("elementRegistered", listener, {
        signal: controller.signal,
      })

      manager.register({ element: createMockElement("e1"), callback: vi.fn() })
      expect(listener).toHaveBeenCalledTimes(1)

      controller.abort()

      manager.register({ element: createMockElement("e2"), callback: vi.fn() })
      expect(listener).toHaveBeenCalledTimes(1) // Should not be called again
    })

    it("should not add listener if signal already aborted", () => {
      const manager = ForesightManager.initialize()
      const listener = vi.fn()
      const controller = new AbortController()
      controller.abort()

      manager.addEventListener("elementRegistered", listener, {
        signal: controller.signal,
      })
      manager.register({ element: createMockElement(), callback: vi.fn() })

      expect(listener).not.toHaveBeenCalled()
    })

    it("should report hasListeners correctly", () => {
      const manager = ForesightManager.initialize()

      expect(manager.hasListeners("elementRegistered")).toBe(false)

      const listener = vi.fn()
      manager.addEventListener("elementRegistered", listener)

      expect(manager.hasListeners("elementRegistered")).toBe(true)

      manager.removeEventListener("elementRegistered", listener)

      expect(manager.hasListeners("elementRegistered")).toBe(false)
    })

    it("should handle multiple listeners for same event", () => {
      const manager = ForesightManager.initialize()
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      manager.addEventListener("elementRegistered", listener1)
      manager.addEventListener("elementRegistered", listener2)
      manager.register({ element: createMockElement(), callback: vi.fn() })

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it("should continue if one listener throws", () => {
      const manager = ForesightManager.initialize()
      const errorListener = vi.fn(() => {
        throw new Error("Listener error")
      })
      const normalListener = vi.fn()

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      manager.addEventListener("elementRegistered", errorListener)
      manager.addEventListener("elementRegistered", normalListener)
      manager.register({ element: createMockElement(), callback: vi.fn() })

      expect(errorListener).toHaveBeenCalledTimes(1)
      expect(normalListener).toHaveBeenCalledTimes(1)

      consoleSpy.mockRestore()
    })
  })

  describe("Callback Flow", () => {
    it("should track callback invocation and completion", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const invokedListener = vi.fn()
      const completedListener = vi.fn()

      manager.addEventListener("callbackInvoked", invokedListener)
      manager.addEventListener("callbackCompleted", completedListener)

      const callback = vi.fn()
      manager.register({ element, callback, name: "test" })

      fire(manager, getEntry(manager, element), { kind: "mouse", subType: "trajectory" })

      // Wait for async callback wrapper
      await vi.runAllTimersAsync()

      expect(invokedListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "callbackInvoked",
          hitType: { kind: "mouse", subType: "trajectory" },
        })
      )

      expect(completedListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "callbackCompleted",
          status: "success",
          errorMessage: null,
        })
      )
    })

    it("should track callback errors", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const completedListener = vi.fn()
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      manager.addEventListener("callbackCompleted", completedListener)

      const errorCallback = vi.fn().mockRejectedValue(new Error("Callback failed"))
      manager.register({ element, callback: errorCallback, name: "test" })

      fire(manager, getEntry(manager, element))

      await vi.runAllTimersAsync()

      expect(completedListener).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          errorMessage: "Callback failed",
        })
      )

      consoleSpy.mockRestore()
    })

    it("should deactivate element after callback completes", async () => {
      const { manager, entry } = setupBasicTest({ reactivateAfter: Infinity })

      expect(entry.state.isActive).toBe(true)

      fire(manager, entry)

      await vi.runAllTimersAsync()

      expect(entry.state.isActive).toBe(false)
      expect(entry.state.isPredicted).toBe(true)
      expect(entry.state.isCallbackRunning).toBe(false)
    })

    it("should update hit counters on callback invocation", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })

      fire(manager, getEntry(manager, element), { kind: "mouse", subType: "trajectory" })
      await vi.runAllTimersAsync()

      const data = manager.getManagerData
      expect(data.globalCallbackHits.mouse.trajectory).toBe(1)
      expect(data.globalCallbackHits.total).toBe(1)
    })

    it("should prevent duplicate callback invocation while running", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const callback = vi.fn()

      manager.register({ element, callback })
      const entry = getEntry(manager, element)

      fire(manager, entry)
      fire(manager, entry)

      await vi.runAllTimersAsync()

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe("Reactivation", () => {
    it("should reactivate element after timeout", async () => {
      const { manager, entry } = setupReactivationTest(5000)

      fire(manager, entry)

      // Only advance enough for the callback to complete, not the reactivation timer
      await vi.advanceTimersByTimeAsync(100)

      expect(entry.state.isActive).toBe(false)

      // Now advance past reactivateAfter
      await vi.advanceTimersByTimeAsync(5000)

      expect(entry.state.isActive).toBe(true)
    })

    it("should not reactivate if reactivateAfter is Infinity", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), reactivateAfter: Infinity })

      const entry = getEntry(manager, element)
      fire(manager, entry)
      await vi.runAllTimersAsync()

      await vi.advanceTimersByTimeAsync(100000)

      expect(entry.state.isActive).toBe(false)
    })

    it("should support manual reactivation", async () => {
      const { manager, element, entry } = setupBasicTest({ reactivateAfter: Infinity })

      fire(manager, entry)
      await vi.runAllTimersAsync()

      expect(entry.state.isActive).toBe(false)

      manager.reactivate(element)

      expect(entry.state.isActive).toBe(true)
    })

    it("should not reactivate non-existent element", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      // Should not throw
      expect(() => manager.reactivate(element)).not.toThrow()
    })
  })

  describe("Element Activity State", () => {
    it("should be active and not predicted on registration", () => {
      const { entry } = setupBasicTest()

      // Element should be checkable: visible (mocked), active, not predicted
      expect(entry.state.isActive).toBe(true)
      expect(entry.state.isPredicted).toBe(false)
    })

    it("should be predicted and running while callback is running", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      let resolveCallback: () => void
      const slowCallback = new Promise<void>(resolve => {
        resolveCallback = resolve
      })

      manager.register({ element, callback: () => slowCallback })
      const entry = getEntry(manager, element)

      fire(manager, entry)

      // While callback is running, element should be predicted and callback running
      expect(entry.state.isPredicted).toBe(true)
      expect(entry.state.isCallbackRunning).toBe(true)

      // Resolve the callback
      resolveCallback!()
      await vi.runAllTimersAsync()

      expect(entry.state.isPredicted).toBe(true)
      expect(entry.state.isCallbackRunning).toBe(false)
    })

    it("should update viewport intersection state", () => {
      const { manager, entry } = setupBasicTest()

      expect(entry.state.isActive).toBe(true)

      // @ts-expect-error - accessing private method
      manager.updateElementState(entry, { isIntersectingWithViewport: false })

      expect(entry.state.isIntersectingWithViewport).toBe(false)
    })
  })

  describe("scannableElements set (mouse trajectory scan)", () => {
    it("should include a freshly registered active, on-screen element", () => {
      const { manager, entry } = setupBasicTest()

      expect(getScannableElements(manager).has(entry)).toBe(true)
    })

    it("should exclude an element registered while disabled", () => {
      const { manager, entry } = setupBasicTest({ enabled: false })

      expect(entry.state.isActive).toBe(false)
      expect(getScannableElements(manager).has(entry)).toBe(false)
    })

    it("should drop an element that leaves the viewport and re-add it on return", () => {
      const { manager, entry } = setupBasicTest()
      const scannable = getScannableElements(manager)
      expect(scannable.has(entry)).toBe(true)

      // @ts-expect-error - accessing private method
      manager.updateElementState(entry, { isIntersectingWithViewport: false })
      expect(scannable.has(entry)).toBe(false)

      // @ts-expect-error - accessing private method
      manager.updateElementState(entry, { isIntersectingWithViewport: true })
      expect(scannable.has(entry)).toBe(true)
    })

    it("should drop an element once it is predicted (has fired)", async () => {
      const { manager, entry } = setupBasicTest({ reactivateAfter: Infinity })
      const scannable = getScannableElements(manager)
      expect(scannable.has(entry)).toBe(true)

      fire(manager, entry)
      await vi.runAllTimersAsync()

      expect(entry.state.isPredicted).toBe(true)
      expect(scannable.has(entry)).toBe(false)
    })

    it("should re-add an element when it reactivates after firing", async () => {
      const { manager, element, entry } = setupBasicTest({ reactivateAfter: Infinity })
      const scannable = getScannableElements(manager)

      fire(manager, entry)
      await vi.runAllTimersAsync()
      expect(scannable.has(entry)).toBe(false)

      manager.reactivate(element)

      expect(entry.state.isActive).toBe(true)
      expect(scannable.has(entry)).toBe(true)
    })

    it("should remove an element from the set on unregister", () => {
      const { manager, element, entry } = setupBasicTest()
      const scannable = getScannableElements(manager)
      expect(scannable.has(entry)).toBe(true)

      manager.unregister(element)

      expect(scannable.has(entry)).toBe(false)
    })

    it("should track only the on-screen active elements across a mixed set", () => {
      const manager = ForesightManager.initialize()
      const active = createMockElement("active")
      const offscreen = createMockElement("offscreen")
      const disabled = createMockElement("disabled")

      manager.register({ element: active, callback: vi.fn() })
      manager.register({ element: offscreen, callback: vi.fn() })
      manager.register({ element: disabled, callback: vi.fn(), enabled: false })

      const activeEntry = getEntry(manager, active)
      const offscreenEntry = getEntry(manager, offscreen)
      const disabledEntry = getEntry(manager, disabled)

      // @ts-expect-error - accessing private method
      manager.updateElementState(offscreenEntry, { isIntersectingWithViewport: false })

      const scannable = getScannableElements(manager)
      expect(scannable.size).toBe(1)
      expect(scannable.has(activeEntry)).toBe(true)
      expect(scannable.has(offscreenEntry)).toBe(false)
      expect(scannable.has(disabledEntry)).toBe(false)
    })
  })

  describe("Settings Management", () => {
    it("should clamp numeric settings to valid ranges", () => {
      const manager = ForesightManager.initialize({
        trajectoryPredictionTime: 500, // Above max
        positionHistorySize: 1, // Below min
      })

      const data = manager.getManagerData
      expect(data.globalSettings.trajectoryPredictionTime).toBe(200) // Clamped to max
      expect(data.globalSettings.positionHistorySize).toBe(2) // Clamped to min
    })

    it("should alter settings and emit event", () => {
      const manager = ForesightManager.initialize()
      const listener = vi.fn()

      manager.addEventListener("managerSettingsChanged", listener)
      manager.alterGlobalSettings({ trajectoryPredictionTime: 100 })

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "managerSettingsChanged",
          updatedSettings: expect.arrayContaining([
            expect.objectContaining({
              setting: "trajectoryPredictionTime",
              newValue: 100,
            }),
          ]),
        })
      )
    })

    it("should not emit event if settings unchanged", () => {
      const manager = ForesightManager.initialize({ trajectoryPredictionTime: 120 })
      const listener = vi.fn()

      manager.addEventListener("managerSettingsChanged", listener)
      manager.alterGlobalSettings({ trajectoryPredictionTime: 120 }) // Same value

      expect(listener).not.toHaveBeenCalled()
    })

    it("should toggle boolean settings", () => {
      const manager = ForesightManager.initialize({ enableMousePrediction: true })

      manager.alterGlobalSettings({ enableMousePrediction: false })

      expect(manager.getManagerData.globalSettings.enableMousePrediction).toBe(false)
    })

    it("should update defaultHitSlop and recompute element bounds", () => {
      const { manager } = setupBasicTest()
      const listener = vi.fn()

      manager.addEventListener("managerSettingsChanged", listener)

      manager.alterGlobalSettings({ defaultHitSlop: 50 })

      expect(manager.getManagerData.globalSettings.defaultHitSlop).toEqual({
        top: 50,
        left: 50,
        right: 50,
        bottom: 50,
      })
    })
  })

  describe("Manager Data", () => {
    it("should expose readonly manager data", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })

      const data = manager.getManagerData

      expect(data.registeredElements.size).toBe(1)
      expect(data.activeElementCount).toBe(1)
      expect(data.globalSettings).toBeDefined()
      expect(data.globalCallbackHits.total).toBe(0)
    })

    it("should track active element count", async () => {
      const manager = ForesightManager.initialize()
      const element1 = createMockElement("e1")
      const element2 = createMockElement("e2")

      manager.register({ element: element1, callback: vi.fn() })
      manager.register({ element: element2, callback: vi.fn() })

      expect(manager.getManagerData.activeElementCount).toBe(2)

      fire(manager, getEntry(manager, element1))
      await vi.runAllTimersAsync()

      expect(manager.getManagerData.activeElementCount).toBe(1)
    })
  })

  describe("Lazy Loading", () => {
    it("should not have handlers loaded before first registration", () => {
      const manager = ForesightManager.initialize()

      const data = manager.getManagerData
      expect(data.loadedModules.desktopHandler).toBe(false)
      expect(data.loadedModules.touchHandler).toBe(false)
      expect(data.loadedModules.predictors.mouse).toBe(false)
      expect(data.loadedModules.predictors.tab).toBe(false)
      expect(data.loadedModules.predictors.scroll).toBe(false)
      expect(data.loadedModules.predictors.viewport).toBe(false)
      expect(data.loadedModules.predictors.touchStart).toBe(false)
    })

    it("should lazy load desktop handler on first element registration", async () => {
      vi.useRealTimers() // Need real timers for dynamic imports
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      // Before registration, no handlers loaded
      expect(manager.getManagerData.loadedModules.desktopHandler).toBe(false)

      manager.register({ element, callback: vi.fn() })

      // Wait for async handler loading to complete
      await vi.waitFor(() => {
        expect(manager.getManagerData.loadedModules.desktopHandler).toBe(true)
      })
      vi.useFakeTimers()
    })

    it("should expose loadedModules in getManagerData", () => {
      const manager = ForesightManager.initialize()

      const data = manager.getManagerData

      expect(data.loadedModules).toBeDefined()
      expect(data.loadedModules).toHaveProperty("desktopHandler")
      expect(data.loadedModules).toHaveProperty("touchHandler")
      expect(data.loadedModules).toHaveProperty("predictors")
      expect(data.loadedModules.predictors).toHaveProperty("mouse")
      expect(data.loadedModules.predictors).toHaveProperty("tab")
      expect(data.loadedModules.predictors).toHaveProperty("scroll")
      expect(data.loadedModules.predictors).toHaveProperty("viewport")
      expect(data.loadedModules.predictors).toHaveProperty("touchStart")
    })

    it("should load mouse predictor with desktop handler", async () => {
      vi.useRealTimers()
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })

      // Mouse predictor is always loaded with DesktopHandler
      await vi.waitFor(() => {
        expect(manager.getManagerData.loadedModules.predictors.mouse).toBe(true)
      })
      vi.useFakeTimers()
    })

    it("should lazy load tab predictor when enabled", async () => {
      vi.useRealTimers()
      const manager = ForesightManager.initialize({ enableTabPrediction: true })
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })

      await vi.waitFor(() => {
        expect(manager.getManagerData.loadedModules.predictors.tab).toBe(true)
      })
      vi.useFakeTimers()
    })

    it("should not load tab predictor when disabled", async () => {
      await expectPredictorNotLoaded("tab", { enableTabPrediction: false })
    })

    it("should lazy load scroll predictor when enabled", async () => {
      vi.useRealTimers()
      const manager = ForesightManager.initialize({ enableScrollPrediction: true })
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })

      await vi.waitFor(() => {
        expect(manager.getManagerData.loadedModules.predictors.scroll).toBe(true)
      })
      vi.useFakeTimers()
    })

    it("should not load scroll predictor when disabled", async () => {
      await expectPredictorNotLoaded("scroll", { enableScrollPrediction: false })
    })
  })

  describe("NodeList Support", () => {
    describe("register with NodeList", () => {
      it("should register all elements in a NodeList", () => {
        const manager = ForesightManager.initialize()
        const nodeList = createMockNodeList(3)

        const results = manager.register({ element: nodeList, callback: vi.fn() })

        expect(results).toHaveLength(3)
        expect(manager.registeredElements.size).toBe(3)
      })

      it("should return an array of ForesightRegisterResult", () => {
        const manager = ForesightManager.initialize()
        const nodeList = createMockNodeList(2)

        const results = manager.register({ element: nodeList, callback: vi.fn() })

        expect(Array.isArray(results)).toBe(true)
        results.forEach(result => {
          expect(result.isRegistered).toBe(true)
          expect(result.id).not.toBe("")
        })
      })

      it("should return a single ForesightRegisterResult for a single element", () => {
        const manager = ForesightManager.initialize()
        const element = createMockElement()

        const result = manager.register({ element, callback: vi.fn() })

        expect(Array.isArray(result)).toBe(false)
        expect(result.isRegistered).toBe(true)
      })

      it("should assign unique IDs to each element in NodeList", () => {
        const manager = ForesightManager.initialize()
        const nodeList = createMockNodeList(3)

        const results = manager.register({ element: nodeList, callback: vi.fn() })

        const ids = results.map(result => result.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(3)
      })

      it("should share the same callback across all NodeList elements", () => {
        const manager = ForesightManager.initialize()
        const nodeList = createMockNodeList(2)
        const callback = vi.fn()

        manager.register({ element: nodeList, callback })

        nodeList.forEach(el => {
          const entry = getEntry(manager, el)
          expect(entry.callback).toBe(callback)
        })
      })

      it("should apply shared hitSlop to all NodeList elements", () => {
        const manager = ForesightManager.initialize()
        const nodeList = createMockNodeList(2)

        manager.register({ element: nodeList, callback: vi.fn(), hitSlop: 20 })

        nodeList.forEach(el => {
          const state = manager.registeredElements.get(el)
          expect(state?.hitSlop).toEqual({
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
          })
        })
      })

      it("should emit elementRegistered event for each element in NodeList", () => {
        const manager = ForesightManager.initialize()
        const nodeList = createMockNodeList(3)
        const listener = vi.fn()

        manager.addEventListener("elementRegistered", listener)
        manager.register({ element: nodeList, callback: vi.fn() })

        expect(listener).toHaveBeenCalledTimes(3)
      })

      it("should handle empty NodeList", () => {
        const manager = ForesightManager.initialize()
        const container = document.createElement("div")
        document.body.appendChild(container)
        const emptyNodeList = container.querySelectorAll(".nonexistent")

        const results = manager.register({ element: emptyNodeList, callback: vi.fn() })

        expect(results).toHaveLength(0)
        expect(manager.registeredElements.size).toBe(0)
      })
    })

    describe("unregister with NodeList", () => {
      it("should unregister all elements in a NodeList", () => {
        const manager = ForesightManager.initialize()
        const nodeList = createMockNodeList(3)

        manager.register({ element: nodeList, callback: vi.fn() })
        expect(manager.registeredElements.size).toBe(3)

        manager.unregister(nodeList)
        expect(manager.registeredElements.size).toBe(0)
      })

      it("should emit elementUnregistered event for each element", () => {
        const manager = ForesightManager.initialize()
        const nodeList = createMockNodeList(3)
        const listener = vi.fn()

        manager.register({ element: nodeList, callback: vi.fn() })
        manager.addEventListener("elementUnregistered", listener)
        manager.unregister(nodeList)

        expect(listener).toHaveBeenCalledTimes(3)
      })

      it("should handle unregistering NodeList with non-registered elements", () => {
        const manager = ForesightManager.initialize()
        const nodeList = createMockNodeList(2)

        expect(() => manager.unregister(nodeList)).not.toThrow()
      })
    })

    describe("reactivate with NodeList", () => {
      it("should reactivate all elements in a NodeList", async () => {
        const manager = ForesightManager.initialize()
        const nodeList = createMockNodeList(2)

        manager.register({ element: nodeList, callback: vi.fn(), reactivateAfter: Infinity })

        // Deactivate all elements
        for (const el of Array.from(nodeList)) {
          fire(manager, getEntry(manager, el))
        }
        await vi.runAllTimersAsync()

        // Verify all deactivated
        nodeList.forEach(el => {
          expect(manager.registeredElements.get(el)?.isActive).toBe(false)
        })

        manager.reactivate(nodeList)

        // Verify all reactivated
        nodeList.forEach(el => {
          expect(manager.registeredElements.get(el)?.isActive).toBe(true)
        })
      })

      it("should handle reactivating NodeList with non-registered elements", () => {
        const manager = ForesightManager.initialize()
        const nodeList = createMockNodeList(2)

        expect(() => manager.reactivate(nodeList)).not.toThrow()
      })
    })
  })

  describe("Callback receives state snapshot", () => {
    it("should pass state to callback on invocation", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const callback = vi.fn()

      manager.register({ element, callback, name: "test-element" })

      fire(manager, getEntry(manager, element))
      await vi.runAllTimersAsync()

      expect(callback).toHaveBeenCalledTimes(1)
      const received: ForesightElementState = callback.mock.calls[0][0]
      expect(received.name).toBe("test-element")
    })

    it("should pass correct state for each NodeList element callback", async () => {
      const manager = ForesightManager.initialize()
      const nodeList = createMockNodeList(2)
      const callback = vi.fn()

      manager.register({ element: nodeList, callback })

      // Trigger callback on first element
      const firstInternal = getEntry(manager, nodeList[0])
      fire(manager, firstInternal)
      await vi.runAllTimersAsync()

      expect(callback).toHaveBeenCalledTimes(1)
      const received: ForesightElementState = callback.mock.calls[0][0]
      expect(received.id).toBe(firstInternal.state.id)
    })

    it("should still work with callbacks that ignore the parameter", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const callback = vi.fn(() => {})

      manager.register({ element, callback })

      fire(manager, getEntry(manager, element), { kind: "mouse", subType: "trajectory" })
      await vi.runAllTimersAsync()

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe("Subscribe / getSnapshot", () => {
    it("should notify subscriber when state changes", async () => {
      const { manager, entry, result } = setupBasicTest()
      const listener = vi.fn()
      result.subscribe(listener)

      fire(manager, entry)
      // markElementAsRunning triggers a state update (isPredicted: true)
      expect(listener).toHaveBeenCalled()
    })

    it("should stop notifying after unsubscribe", async () => {
      const { manager, entry, result } = setupBasicTest()
      const listener = vi.fn()
      const unsubscribe = result.subscribe(listener)

      unsubscribe()

      fire(manager, entry)
      await vi.runAllTimersAsync()

      expect(listener).not.toHaveBeenCalled()
    })

    it("should return correct state from getSnapshot immediately after registration", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      const result = manager.register({ element, callback: vi.fn(), name: "snap-test" })

      const snapshot = result.getSnapshot()
      expect(snapshot.name).toBe("snap-test")
      expect(snapshot.isRegistered).toBe(true)
      expect(snapshot.isActive).toBe(true)
      expect(snapshot.isPredicted).toBe(false)
    })

    it("should return updated state from getSnapshot after state change", async () => {
      const { manager, entry, result } = setupBasicTest({ reactivateAfter: Infinity })

      expect(result.getSnapshot().isPredicted).toBe(false)
      expect(result.getSnapshot().isCallbackRunning).toBe(false)

      fire(manager, entry)

      expect(result.getSnapshot().isPredicted).toBe(true)
      expect(result.getSnapshot().isCallbackRunning).toBe(true)

      await vi.runAllTimersAsync()

      expect(result.getSnapshot().isPredicted).toBe(true)
      expect(result.getSnapshot().isCallbackRunning).toBe(false)
      expect(result.getSnapshot().isActive).toBe(false)
    })

    it("should support multiple independent subscribers", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      const result = manager.register({ element, callback: vi.fn() })
      const unsub1 = result.subscribe(listener1)
      result.subscribe(listener2)

      fire(manager, getEntry(manager, element))

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()

      const count1 = listener1.mock.calls.length
      unsub1()

      await vi.runAllTimersAsync()

      // listener1 should not have been called again after unsub
      expect(listener1).toHaveBeenCalledTimes(count1)
      // listener2 should have received additional notifications
      expect(listener2.mock.calls.length).toBeGreaterThan(count1)
    })

    it("should reflect latest state after unsubscribe and resubscribe", async () => {
      const { manager, entry, result } = setupBasicTest({ reactivateAfter: Infinity })

      const unsub = result.subscribe(vi.fn())
      unsub()

      fire(manager, entry)
      await vi.runAllTimersAsync()

      // Resubscribe - getSnapshot must reflect state that changed while unsubscribed
      const listener = vi.fn()
      result.subscribe(listener)

      expect(result.getSnapshot().isActive).toBe(false)
      expect(result.getSnapshot().status).toBe("success")
    })

    it("should clear subscribers on unregister", () => {
      const { manager, element, result } = setupBasicTest()
      const listener = vi.fn()
      result.subscribe(listener)

      manager.unregister(element)

      // The unregister itself triggers a state update - listener is notified
      const callCount = listener.mock.calls.length
      expect(callCount).toBeGreaterThan(0)

      // After unregister, no further notifications should be possible
      // (subscribers.clear() was called)
      const entry = result.getSnapshot()
      expect(entry.isRegistered).toBe(false)
    })

    it("should provide a stable getSnapshot reference across re-registration", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      const result1 = manager.register({ element, callback: vi.fn() })
      const result2 = manager.register({ element, callback: vi.fn() })

      // Both results should read from the same internal entry
      expect(result2.getSnapshot().registerCount).toBe(2)
      expect(result1.getSnapshot().registerCount).toBe(2)
    })
  })

  describe("subscribeToElement", () => {
    it("should return undefined for an unregistered element", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      const result = manager.subscribeToElement(element, vi.fn())
      expect(result).toBeUndefined()
    })

    it("should notify listener when element state changes", () => {
      const { manager, element, entry } = setupBasicTest()
      const listener = vi.fn()

      manager.subscribeToElement(element, listener)

      fire(manager, entry)
      expect(listener).toHaveBeenCalled()
    })

    it("should stop notifying after unsubscribe", async () => {
      const { manager, element, entry } = setupBasicTest()
      const listener = vi.fn()

      const unsubscribe = manager.subscribeToElement(element, listener)!
      unsubscribe()

      fire(manager, entry)
      await vi.runAllTimersAsync()

      expect(listener).not.toHaveBeenCalled()
    })

    it("should allow reading latest state via registeredElements inside listener", () => {
      const { manager, element, entry } = setupBasicTest()
      let capturedState: ForesightElementState | undefined

      manager.subscribeToElement(element, () => {
        capturedState = manager.registeredElements.get(element)
      })

      fire(manager, entry)

      expect(capturedState).toBeDefined()
      expect(capturedState!.isPredicted).toBe(true)
    })

    it("should clean up subscribers when element is unregistered", () => {
      const { manager, element } = setupBasicTest()
      const listener = vi.fn()

      manager.subscribeToElement(element, listener)

      manager.unregister(element)

      // Listener is called during unregister (state update to isRegistered: false)
      const callCount = listener.mock.calls.length
      expect(callCount).toBeGreaterThan(0)

      // After unregister, subscribing again should return undefined
      const result = manager.subscribeToElement(element, vi.fn())
      expect(result).toBeUndefined()
    })

    it("should support multiple independent subscribers", async () => {
      const { manager, element, entry } = setupBasicTest({ reactivateAfter: Infinity })
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      const unsub1 = manager.subscribeToElement(element, listener1)!
      manager.subscribeToElement(element, listener2)

      fire(manager, entry)
      await vi.runAllTimersAsync()

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()

      const count1 = listener1.mock.calls.length
      unsub1()

      // Trigger another state change via manual reactivation
      manager.reactivate(element)

      expect(listener1).toHaveBeenCalledTimes(count1)
      expect(listener2.mock.calls.length).toBeGreaterThan(count1)
    })
  })

  describe("bounds channel (getBounds / subscribeToBounds)", () => {
    /** Simulate the element moving and the manager picking up the new rect. */
    const moveElement = (
      manager: ForesightManager,
      entry: ForesightElementInternal,
      top: number,
      left: number
    ) => {
      entry.element.getBoundingClientRect = vi.fn(
        () =>
          ({
            top,
            left,
            right: left + 100,
            bottom: top + 100,
            width: 100,
            height: 100,
            x: left,
            y: top,
            toJSON: () => ({}),
          }) as DOMRect
      )
      // @ts-expect-error - accessing private method for tests
      manager.forceUpdateElementBounds(entry)
    }

    it("should notify bounds subscribers only on a rect-only update and keep getSnapshot stable", () => {
      const { manager, entry, result } = setupBasicTest()
      const stateListener = vi.fn()
      const boundsListener = vi.fn()
      result.subscribe(stateListener)
      result.subscribeToBounds(boundsListener)

      const snapshotBefore = result.getSnapshot()
      const boundsBefore = result.getBounds()

      moveElement(manager, entry, 300, 300)

      expect(boundsListener).toHaveBeenCalledTimes(1)
      expect(stateListener).not.toHaveBeenCalled()
      expect(result.getSnapshot()).toBe(snapshotBefore)
      expect(result.getBounds()).not.toBe(boundsBefore)
      expect(result.getBounds().originalRect.top).toBe(300)
    })

    it("should notify state subscribers only on a logical change and keep getBounds stable", async () => {
      const { manager, entry, result } = setupBasicTest()
      const stateListener = vi.fn()
      const boundsListener = vi.fn()
      result.subscribe(stateListener)
      result.subscribeToBounds(boundsListener)

      const boundsBefore = result.getBounds()

      fire(manager, entry)
      await vi.runAllTimersAsync()

      expect(stateListener).toHaveBeenCalled()
      expect(boundsListener).not.toHaveBeenCalled()
      expect(result.getBounds()).toBe(boundsBefore)
    })

    it("should not notify bounds subscribers when the rect is unchanged", () => {
      const { manager, entry, result } = setupBasicTest()
      const boundsListener = vi.fn()
      result.subscribeToBounds(boundsListener)
      const boundsBefore = result.getBounds()

      // Same rect as createMockElement returns - content-equal, so a no-op
      moveElement(manager, entry, 100, 100)

      expect(boundsListener).not.toHaveBeenCalled()
      expect(result.getBounds()).toBe(boundsBefore)
    })

    it("should update bounds before state on a hitSlop change so state listeners read fresh geometry", () => {
      const { manager, element, result } = setupBasicTest({ hitSlop: 10 })
      const order: string[] = []
      let expandedRectInStateListener: number | undefined

      result.subscribeToBounds(() => {
        order.push("bounds")
      })
      result.subscribe(() => {
        order.push("state")
        expandedRectInStateListener = result.getBounds().expandedRect.top
      })

      manager.updateElementOptions(element, { hitSlop: 50 })

      expect(order).toEqual(["bounds", "state"])
      // top of element is 100, hitSlop 50 -> expandedRect.top is already 50
      expect(expandedRectInStateListener).toBe(50)
    })

    it("should return undefined from subscribeToElementBounds/getElementBounds for unregistered elements", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      expect(manager.subscribeToElementBounds(element, vi.fn())).toBeUndefined()
      expect(manager.getElementBounds(element)).toBeUndefined()
    })

    it("should notify manager-level bounds subscribers and clear them on unregister", () => {
      const { manager, element, entry } = setupBasicTest()
      const boundsListener = vi.fn()

      manager.subscribeToElementBounds(element, boundsListener)
      moveElement(manager, entry, 300, 300)
      expect(boundsListener).toHaveBeenCalledTimes(1)

      manager.unregister(element)
      // Unregister only touches logical state - bounds listeners stay quiet
      expect(boundsListener).toHaveBeenCalledTimes(1)
      expect(manager.subscribeToElementBounds(element, vi.fn())).toBeUndefined()
    })

    it("should bind getBounds and subscribeToBounds to the surviving entry on re-registration", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      const result1 = manager.register({ element, callback: vi.fn() })
      const result2 = manager.register({ element, callback: vi.fn() })

      expect(result2.getBounds()).toBe(result1.getBounds())

      const boundsListener = vi.fn()
      result1.subscribeToBounds(boundsListener)
      moveElement(manager, getEntry(manager, element), 300, 300)

      expect(boundsListener).toHaveBeenCalledTimes(1)
      expect(result2.getBounds().originalRect.top).toBe(300)
    })
  })

  describe("updateElementOptions", () => {
    it("should update reactivateAfter", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), reactivateAfter: 5000 })
      expect(manager.registeredElements.get(element)?.reactivateAfter).toBe(5000)

      manager.updateElementOptions(element, { reactivateAfter: 1000 })
      expect(manager.registeredElements.get(element)?.reactivateAfter).toBe(1000)
    })

    it("should update callback", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const callbackA = vi.fn()
      const callbackB = vi.fn()

      manager.register({ element, callback: callbackA, reactivateAfter: 500 })
      const entry = getEntry(manager, element)

      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      expect(callbackA).toHaveBeenCalledTimes(1)

      // Reactivate, update callback, then fire again
      await vi.advanceTimersByTimeAsync(500)
      manager.updateElementOptions(element, { callback: callbackB })

      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      expect(callbackA).toHaveBeenCalledTimes(1)
      expect(callbackB).toHaveBeenCalledTimes(1)
    })

    it("should update name", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), name: "old-name" })
      expect(manager.registeredElements.get(element)?.name).toBe("old-name")

      manager.updateElementOptions(element, { name: "new-name" })
      expect(manager.registeredElements.get(element)?.name).toBe("new-name")
    })

    it("should update meta", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), meta: { route: "/a" } })
      expect(manager.registeredElements.get(element)?.meta).toEqual({ route: "/a" })

      manager.updateElementOptions(element, { meta: { route: "/b", priority: 1 } })
      expect(manager.registeredElements.get(element)?.meta).toEqual({ route: "/b", priority: 1 })
    })

    it("should update hitSlop and recompute expanded bounds", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), hitSlop: 10 })
      expect(manager.getElementBounds(element)?.expandedRect).toEqual({
        top: 90,
        left: 90,
        right: 210,
        bottom: 210,
      })

      manager.updateElementOptions(element, { hitSlop: 50 })

      expect(manager.registeredElements.get(element)!.hitSlop).toEqual({
        top: 50,
        left: 50,
        right: 50,
        bottom: 50,
      })
      expect(manager.getElementBounds(element)!.expandedRect).toEqual({
        top: 50,
        left: 50,
        right: 250,
        bottom: 250,
      })
    })

    it("should update hitSlop from a Rect object", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), hitSlop: 10 })
      manager.updateElementOptions(element, {
        hitSlop: { top: 0, left: 20, right: 30, bottom: 40 },
      })

      expect(manager.registeredElements.get(element)!.hitSlop).toEqual({
        top: 0,
        left: 20,
        right: 30,
        bottom: 40,
      })
      expect(manager.getElementBounds(element)!.expandedRect).toEqual({
        top: 100,
        left: 80,
        right: 230,
        bottom: 240,
      })
    })

    it("should preserve hitSlop and not notify subscribers when hitSlop is unchanged", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const listener = vi.fn()
      const boundsListener = vi.fn()

      const result = manager.register({ element, callback: vi.fn(), hitSlop: 10 })
      result.subscribe(listener)
      result.subscribeToBounds(boundsListener)
      const hitSlopBefore = manager.registeredElements.get(element)!.hitSlop
      const boundsBefore = manager.getElementBounds(element)

      // Equivalent hitSlop (number vs normalized Rect) should be a no-op
      manager.updateElementOptions(element, {
        hitSlop: { top: 10, left: 10, right: 10, bottom: 10 },
      })

      expect(manager.registeredElements.get(element)!.hitSlop).toBe(hitSlopBefore)
      expect(manager.getElementBounds(element)).toBe(boundsBefore)
      expect(listener).not.toHaveBeenCalled()
      expect(boundsListener).not.toHaveBeenCalled()
    })

    it("should preserve previous values when options are omitted", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({
        element,
        callback: vi.fn(),
        name: "my-name",
        reactivateAfter: 3000,
        meta: { x: 1 },
      })

      // Update without name, meta, or reactivateAfter
      manager.updateElementOptions(element, {})

      const state = manager.registeredElements.get(element)!
      expect(state.name).toBe("my-name")
      expect(state.reactivateAfter).toBe(3000)
      expect(state.meta).toEqual({ x: 1 })
    })

    it("should reschedule pending reactivation timeout when reactivateAfter changes", async () => {
      const { manager, element, entry } = await setupReactivationAfterFire(5000)

      manager.updateElementOptions(element, { reactivateAfter: 500 })
      expect(entry.state.reactivateAfter).toBe(500)

      // Original 5000ms timer should have been cleared, new 500ms timer fires
      await vi.advanceTimersByTimeAsync(500)
      expect(entry.state.isActive).toBe(true)
    })

    it("should cancel reactivation when updated with Infinity", async () => {
      const { manager, element, entry } = await setupReactivationAfterFire(2000)

      manager.updateElementOptions(element, { reactivateAfter: Infinity })

      await vi.advanceTimersByTimeAsync(10000)
      expect(entry.state.isActive).toBe(false)
    })

    it("should not reschedule when there is no pending reactivation timeout", async () => {
      const { manager, element, entry } = setupReactivationTest(5000)

      // Element is still active (no callback fired yet), no pending timeout
      expect(entry.state.isActive).toBe(true)
      manager.updateElementOptions(element, { reactivateAfter: 100 })

      // No spurious reactivation should happen - element should stay active (never deactivated)
      await vi.advanceTimersByTimeAsync(200)
      expect(entry.state.isActive).toBe(true)
    })

    it("should schedule reactivation when updated from Infinity to finite while predicted", async () => {
      // Register with Infinity (no reactivation), then fire callback
      const { manager, element, entry } = await setupReactivationAfterFire(Infinity)

      // Element is predicted, no timeout exists
      expect(entry.state.isPredicted).toBe(true)
      expect(entry.reactivateTimeoutId).toBeUndefined()

      manager.updateElementOptions(element, { reactivateAfter: 1000 })
      expect(entry.state.reactivateAfter).toBe(1000)

      // Timeout should now be scheduled and fire after 1000ms
      await vi.advanceTimersByTimeAsync(1000)
      expect(entry.state.isActive).toBe(true)
      expect(entry.state.isPredicted).toBe(false)
    })

    it("should not clear pending reactivation timeout when reactivateAfter is unchanged", async () => {
      const { manager, element, entry } = await setupReactivationAfterFire(2000)

      // Element is predicted with a pending reactivation timeout
      expect(entry.state.isPredicted).toBe(true)
      expect(entry.state.isActive).toBe(false)
      expect(entry.reactivateTimeoutId).toBeDefined()

      // Update options without changing reactivateAfter (simulates what Vue's watcher does)
      manager.updateElementOptions(element, { name: "updated-name" })

      // The reactivation timeout should still be intact
      expect(entry.reactivateTimeoutId).toBeDefined()

      // After the original timeout period, element should reactivate
      await vi.advanceTimersByTimeAsync(2000)
      expect(entry.state.isActive).toBe(true)
      expect(entry.state.isPredicted).toBe(false)
    })

    it("should notify subscribers when options change", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const listener = vi.fn()

      const result = manager.register({ element, callback: vi.fn(), reactivateAfter: 5000 })
      result.subscribe(listener)

      manager.updateElementOptions(element, { reactivateAfter: 1000 })

      expect(listener).toHaveBeenCalled()
    })

    it("should throw when element is not registered", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      expect(() => manager.updateElementOptions(element, { name: "test" })).toThrow(
        "Cannot update options: element is not registered."
      )
    })

    it("should still work through register() for backwards compatibility", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), name: "original" })
      manager.register({ element, callback: vi.fn(), name: "updated" })

      expect(manager.registeredElements.get(element)?.name).toBe("updated")
      expect(manager.registeredElements.get(element)?.registerCount).toBe(2)
    })
  })

  describe("Element State Lifecycle", () => {
    it("full lifecycle: register → predict → complete → reactivate", async () => {
      const { manager, entry, resolve } = setupDeferredCallbackTest(1000)

      // 1. Registered: not predicted, not running, active
      expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: true })

      // 2. Prediction hit: predicted, running, active
      fire(manager, entry)
      expectState(entry.state, { isPredicted: true, isCallbackRunning: true, isActive: true })

      // 3. Callback completes: predicted, not running, not active
      resolve()
      await vi.advanceTimersByTimeAsync(0) // flush microtask only, not reactivation timer
      expectState(entry.state, { isPredicted: true, isCallbackRunning: false, isActive: false })

      // 4. Reactivated: not predicted, not running, active
      await vi.advanceTimersByTimeAsync(1000)
      expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: true })
    })

    it("lifecycle ending in unregister instead of reactivation", async () => {
      const { manager, element, entry } = setupBasicTest({ reactivateAfter: Infinity })

      expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: true })

      fire(manager, entry)
      await vi.runAllTimersAsync()
      expectState(entry.state, { isPredicted: true, isCallbackRunning: false, isActive: false })

      manager.unregister(element)
      expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: false })
      expect(entry.state.isRegistered).toBe(false)
    })

    it("multiple full cycles via reactivation", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const callback = vi.fn()

      manager.register({ element, callback, reactivateAfter: 500 })
      const entry = getEntry(manager, element)

      // First cycle
      await runReactivationCycle(manager, entry, 500)

      // Second cycle
      await runReactivationCycle(manager, entry, 500)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(entry.state.hitCount).toBe(2)
    })

    it("isPredicted stays true while async callback is in flight", async () => {
      const { manager, entry, resolve } = setupDeferredCallbackTest()

      fire(manager, entry)
      expectState(entry.state, { isPredicted: true, isCallbackRunning: true, isActive: true })

      // Advance time but callback hasn't resolved
      await vi.advanceTimersByTimeAsync(5000)
      expectState(entry.state, { isPredicted: true, isCallbackRunning: true, isActive: true })

      // Now resolve it
      resolve()
      await vi.runAllTimersAsync()
      expectState(entry.state, { isPredicted: true, isCallbackRunning: false, isActive: false })
    })

    it("cannot fire during callback execution", async () => {
      const { manager, entry, callback, resolve } = setupDeferredCallbackTest()

      fire(manager, entry)
      fire(manager, entry) // ignored
      fire(manager, entry) // ignored

      resolve()
      await vi.runAllTimersAsync()

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it("cannot fire after prediction before reactivation", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const callback = vi.fn()

      manager.register({ element, callback, reactivateAfter: 5000 })
      const entry = getEntry(manager, element)

      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)

      // Callback completed, isPredicted still true, not yet reactivated
      expectState(entry.state, { isPredicted: true, isCallbackRunning: false, isActive: false })

      // Attempting to fire again should be blocked
      fire(manager, entry)
      expect(callback).toHaveBeenCalledTimes(1)

      // After reactivation it can fire again
      await vi.advanceTimersByTimeAsync(5000)
      expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: true })

      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it("manual reactivation resets isPredicted", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const callback = vi.fn()

      manager.register({ element, callback, reactivateAfter: Infinity })
      const entry = getEntry(manager, element)

      fire(manager, entry)
      await vi.runAllTimersAsync()
      expectState(entry.state, { isPredicted: true, isCallbackRunning: false, isActive: false })

      manager.reactivate(element)
      expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: true })

      // Can fire again
      fire(manager, entry)
      await vi.runAllTimersAsync()
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it("unregistering mid-callback resets both flags", async () => {
      const { manager, element, entry, resolve } = setupDeferredCallbackTest()

      fire(manager, entry)
      expectState(entry.state, { isPredicted: true, isCallbackRunning: true, isActive: true })

      manager.unregister(element)
      expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: false })
      expect(entry.state.isRegistered).toBe(false)

      resolve()
      await vi.runAllTimersAsync()
    })

    it("erroring callback follows correct lifecycle", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
      const callback = vi.fn(() => {
        throw new Error("callback failed")
      })

      manager.register({ element, callback, reactivateAfter: 1000 })
      const entry = getEntry(manager, element)

      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)

      expectState(entry.state, { isPredicted: true, isCallbackRunning: false, isActive: false })
      expect(entry.state.status).toBe("error")
      expect(entry.state.error).toBe("callback failed")

      // Should still reactivate after timeout
      await vi.advanceTimersByTimeAsync(1000)
      expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: true })

      consoleError.mockRestore()
    })
  })

  describe("enabled option", () => {
    it("registers as inactive when enabled is false", () => {
      const { manager, element, entry } = setupBasicTest({ enabled: false })

      expect(manager.registeredElements.has(element)).toBe(true)
      expect(entry.state.isRegistered).toBe(true)
      expect(entry.state.isEnabled).toBe(false)
      expect(entry.state.isActive).toBe(false)
    })

    it("does not fire its callback while disabled", () => {
      const callback = vi.fn()
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      manager.register({ element, callback, enabled: false })
      const entry = getEntry(manager, element)

      fire(manager, entry)

      expect(callback).not.toHaveBeenCalled()
    })

    it("activates without re-registering when toggled on", () => {
      const { manager, element, entry } = setupBasicTest({ enabled: false })
      expect(entry.state.isActive).toBe(false)

      manager.updateElementOptions(element, { enabled: true })

      expect(entry.state.isEnabled).toBe(true)
      expect(entry.state.isActive).toBe(true)
      expect(manager.registeredElements.get(element)?.registerCount).toBe(1)
    })

    it("deactivates without unregistering when toggled off", () => {
      const { manager, element, entry } = setupBasicTest({ enabled: true })
      expect(entry.state.isActive).toBe(true)

      manager.updateElementOptions(element, { enabled: false })

      expect(entry.state.isRegistered).toBe(true)
      expect(entry.state.isEnabled).toBe(false)
      expect(entry.state.isActive).toBe(false)
      expect(manager.registeredElements.has(element)).toBe(true)
    })

    it("leaves enabled unchanged when the option is omitted on patch", () => {
      const { manager, element, entry } = setupBasicTest({ enabled: false })

      manager.updateElementOptions(element, { name: "renamed" })

      expect(entry.state.isEnabled).toBe(false)
      expect(entry.state.name).toBe("renamed")
    })

    it("tears down global listeners when the last active element is disabled", () => {
      const { manager, element } = setupBasicTest({ enabled: true })
      // @ts-expect-error - accessing private field for tests
      expect(manager.isSetup).toBe(true)

      manager.updateElementOptions(element, { enabled: false })

      // @ts-expect-error - accessing private field for tests
      expect(manager.isSetup).toBe(false)
    })

    it("re-arms global listeners when re-enabled after firing left the manager idle", async () => {
      const { manager, element, entry } = setupBasicTest({ reactivateAfter: Infinity })

      // Firing the only element drops the active count to zero, which tears the
      // global mouse/trajectory listeners down (isSetup → false).
      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      // @ts-expect-error - accessing private field for tests
      expect(manager.isSetup).toBe(false)

      // Disabling then re-enabling from devtools must bring the listeners back,
      // otherwise the element reads as enabled but never predicts again.
      manager.updateElementOptions(element, { enabled: false })
      manager.updateElementOptions(element, { enabled: true })

      // @ts-expect-error - accessing private field for tests
      expect(manager.isSetup).toBe(true)
      expect(entry.state.isActive).toBe(true)
    })
  })

  describe("limited connection / data saver", () => {
    // shouldRegister is globally mocked in test-setup.ts; drive its return value
    // so registration sees a limited connection (data saver / slow network).
    const setLimited = (isLimitedConnection: boolean) =>
      vi.mocked(hasConnectionLimitations).mockReturnValue(isLimitedConnection)

    beforeEach(() => setLimited(true))
    afterEach(() => setLimited(false))

    it("registers the element but keeps it inactive", () => {
      const { manager, element, entry } = setupBasicTest()

      expect(manager.registeredElements.has(element)).toBe(true)
      expect(entry.state.isRegistered).toBe(true)
      expect(entry.state.isLimitedConnection).toBe(true)
      expect(entry.state.isEnabled).toBe(true)
      expect(entry.state.isActive).toBe(false)
    })

    it("returns a real register result (isRegistered:true, isLimitedConnection:true, isActive:false)", () => {
      const { result } = setupBasicTest()

      expect(result.isRegistered).toBe(true)
      expect(result.isLimitedConnection).toBe(true)
      expect(result.isActive).toBe(false)
      expect(typeof result.unregister).toBe("function")
      expect(typeof result.subscribe).toBe("function")
    })

    it("does not fire its callback on a limited connection", () => {
      const callback = vi.fn()
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      manager.register({ element, callback })
      const entry = getEntry(manager, element)

      fire(manager, entry)

      expect(callback).not.toHaveBeenCalled()
    })

    it("does not count the element as active or observe it", () => {
      const { manager, element } = setupBasicTest()

      expect(manager.getManagerData.activeElementCount).toBe(0)
      // @ts-expect-error - accessing private handler for tests
      const handler = manager.currentlyActiveHandler
      if (handler) {
        expect(handler.observeElement).not.toHaveBeenCalledWith(element)
      }
    })

    it("does not throw when options are patched on a limited connection", () => {
      const { manager, element, entry } = setupBasicTest()

      expect(() => manager.updateElementOptions(element, { name: "renamed" })).not.toThrow()
      expect(entry.state.name).toBe("renamed")
    })

    it("stays inactive when enabled is toggled on during a limited connection", () => {
      const { manager, element, entry } = setupBasicTest({ enabled: false })
      expect(entry.state.isActive).toBe(false)

      manager.updateElementOptions(element, { enabled: true })

      // Enabling must not start prediction on a limited connection.
      expect(entry.state.isEnabled).toBe(true)
      expect(entry.state.isActive).toBe(false)
      expect(manager.getManagerData.activeElementCount).toBe(0)
    })

    it("registers as active when the connection is not limited", () => {
      setLimited(false)
      const { entry } = setupBasicTest()

      expect(entry.state.isLimitedConnection).toBe(false)
      expect(entry.state.isActive).toBe(true)
    })
  })

  describe("DOM disconnect / reconnect (KeepAlive, Teleport, re-parenting)", () => {
    // Invoke the MutationObserver callback directly for deterministic tests; the
    // park/resume decision reads the element's real isConnected state.
    const triggerDomCheck = (
      manager: ForesightManager,
      added: Element[] = [],
      removed: Element[] = []
    ) => {
      // @ts-expect-error - private method invoked directly for tests
      manager.handleDomMutations([
        {
          type: "childList",
          addedNodes: added,
          removedNodes: removed,
        } as unknown as MutationRecord,
      ])
    }

    it("parks the element (registered but inactive) when detached", () => {
      const { manager, element, entry } = setupBasicTest()
      expect(entry.state.isActive).toBe(true)
      expect(entry.state.isParked).toBe(false)

      element.remove()
      triggerDomCheck(manager, [], [element])

      expect(manager.registeredElements.has(element)).toBe(true)
      expect(entry.state.isRegistered).toBe(true)
      expect(entry.state.isActive).toBe(false)
      expect(entry.state.isParked).toBe(true)
    })

    it("does not unregister or emit elementUnregistered on disconnect", () => {
      const { manager, element } = setupBasicTest()
      const onUnregister = vi.fn()
      manager.addEventListener("elementUnregistered", onUnregister)

      element.remove()
      triggerDomCheck(manager, [], [element])

      expect(onUnregister).not.toHaveBeenCalled()
      expect(manager.registeredElements.has(element)).toBe(true)
    })

    it("does not fire its callback while detached", () => {
      const callback = vi.fn()
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      manager.register({ element, callback })
      const entry = getEntry(manager, element)

      element.remove()
      triggerDomCheck(manager, [], [element])
      fire(manager, entry)

      expect(callback).not.toHaveBeenCalled()
    })

    it("resumes (re-activates) when reconnected", () => {
      const { manager, element, entry } = setupBasicTest()

      element.remove()
      triggerDomCheck(manager, [], [element])
      expect(entry.state.isActive).toBe(false)

      document.body.appendChild(element)
      triggerDomCheck(manager, [element], [])

      expect(entry.state.isRegistered).toBe(true)
      expect(entry.state.isActive).toBe(true)
      expect(entry.state.isParked).toBe(false)
    })

    it("tracks parked elements in getManagerData.parkedElementCount", () => {
      const { manager, element } = setupBasicTest()
      expect(manager.getManagerData.parkedElementCount).toBe(0)

      element.remove()
      triggerDomCheck(manager, [], [element])
      expect(manager.getManagerData.parkedElementCount).toBe(1)

      document.body.appendChild(element)
      triggerDomCheck(manager, [element], [])
      expect(manager.getManagerData.parkedElementCount).toBe(0)
    })

    it("keeps global listeners alive while a parked element waits to reconnect", () => {
      const { manager, element } = setupBasicTest()
      // @ts-expect-error - private field
      expect(manager.isSetup).toBe(true)

      element.remove()
      triggerDomCheck(manager, [], [element])

      // No active element, but listeners must stay so reconnection is detected.
      expect(manager.getManagerData.activeElementCount).toBe(0)
      // @ts-expect-error - private field
      expect(manager.isSetup).toBe(true)
    })

    it("can still be explicitly unregistered while parked", () => {
      const { manager, element, result } = setupBasicTest()
      element.remove()
      triggerDomCheck(manager, [], [element])
      expect(manager.getManagerData.parkedElementCount).toBe(1)

      result.unregister()

      expect(manager.registeredElements.has(element)).toBe(false)
      expect(manager.getManagerData.parkedElementCount).toBe(0)
    })

    it("stays inactive on reconnect when the element is disabled", () => {
      const { manager, element, entry } = setupBasicTest({ enabled: false })
      expect(entry.state.isActive).toBe(false)

      element.remove()
      triggerDomCheck(manager, [], [element])
      document.body.appendChild(element)
      triggerDomCheck(manager, [element], [])

      expect(entry.state.isEnabled).toBe(false)
      expect(entry.state.isActive).toBe(false)
    })

    it("does not reactivate a fired element on reconnect (reactivateAfter: Infinity)", async () => {
      const { manager, element, entry } = setupBasicTest({ reactivateAfter: Infinity })

      // Fire the callback, then let it finalize: element becomes inactive + predicted.
      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      expect(entry.state.isActive).toBe(false)
      expect(entry.state.isPredicted).toBe(true)

      // Park (detach) then resume (reconnect).
      element.remove()
      triggerDomCheck(manager, [], [element])
      document.body.appendChild(element)
      triggerDomCheck(manager, [element], [])

      // It already fired and never reactivates, so it must stay inactive + predicted.
      expect(entry.state.isActive).toBe(false)
      expect(entry.state.isPredicted).toBe(true)
    })

    it("resumes the reactivation cooldown for a fired element on reconnect (finite reactivateAfter)", async () => {
      const { manager, element, entry } = setupBasicTest({ reactivateAfter: 5000 })

      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      expect(entry.state.isActive).toBe(false)
      expect(entry.state.isPredicted).toBe(true)

      // Park before the cooldown elapses; the timer is cleared while detached.
      element.remove()
      triggerDomCheck(manager, [], [element])
      document.body.appendChild(element)
      triggerDomCheck(manager, [element], [])

      // Still inactive right after reconnect (cooldown restarted, not reactivated).
      expect(entry.state.isActive).toBe(false)

      // After the cooldown it reactivates.
      await vi.advanceTimersByTimeAsync(5000)
      expect(entry.state.isActive).toBe(true)
      expect(entry.state.isPredicted).toBe(false)
    })
  })
})
