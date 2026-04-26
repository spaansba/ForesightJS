import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { ForesightManager } from "./ForesightManager"
import type {
  ForesightElement,
  ForesightElementInternal,
  ForesightElementState,
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
function resetForesightManager() {
  // Access private static property to reset singleton
  // @ts-expect-error - accessing private static for test reset
  ForesightManager.manager = undefined
}

function getEntry(manager: ForesightManager, element: ForesightElement): ForesightElementInternal {
  // @ts-expect-error - accessing private map for tests
  const entry = manager.elementEntries.get(element) as ForesightElementInternal | undefined
  if (!entry) {
    throw new Error("Element not registered")
  }
  return entry
}

function fire(
  manager: ForesightManager,
  entry: ForesightElementInternal,
  hitType: { kind: "mouse"; subType: "hover" | "trajectory" } = {
    kind: "mouse",
    subType: "hover",
  }
) {
  // @ts-expect-error - accessing private method for tests
  manager.callCallback(entry, hitType)
}

function createMockElement(id = "test-element"): ForesightElement {
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

function createMockNodeList(count: number): NodeListOf<ForesightElement> {
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
      expect(state?.elementBounds.hitSlop).toEqual({
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
      expect(state?.elementBounds.hitSlop).toEqual({
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
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const listener = vi.fn()

      manager.register({ element, callback: vi.fn() })
      manager.addEventListener("elementUnregistered", listener)
      manager.unregister(element)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          wasLastRegisteredElement: true,
        })
      )
    })

    it("should remove element from checkableElements on unregister", () => {
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
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), reactivateAfter: Infinity })

      const entry = getEntry(manager, element)
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
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const reactivatedListener = vi.fn()

      manager.addEventListener("elementReactivated", reactivatedListener)
      manager.register({ element, callback: vi.fn(), reactivateAfter: 5000 })

      const entry = getEntry(manager, element)

      fire(manager, entry)

      // Only advance enough for the callback to complete, not the reactivation timer
      await vi.advanceTimersByTimeAsync(100)

      expect(entry.state.isActive).toBe(false)
      expect(reactivatedListener).not.toHaveBeenCalled()

      // Now advance past reactivateAfter
      await vi.advanceTimersByTimeAsync(5000)

      expect(entry.state.isActive).toBe(true)
      expect(reactivatedListener).toHaveBeenCalledWith(
        expect.objectContaining({ type: "elementReactivated" })
      )
    })

    it("should not reactivate if reactivateAfter is Infinity", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const reactivatedListener = vi.fn()

      manager.addEventListener("elementReactivated", reactivatedListener)
      manager.register({ element, callback: vi.fn(), reactivateAfter: Infinity })

      const entry = getEntry(manager, element)
      fire(manager, entry)
      await vi.runAllTimersAsync()

      await vi.advanceTimersByTimeAsync(100000)

      expect(entry.state.isActive).toBe(false)
      expect(reactivatedListener).not.toHaveBeenCalled()
    })

    it("should support manual reactivation", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), reactivateAfter: Infinity })
      const entry = getEntry(manager, element)

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

  describe("checkableElements Optimization", () => {
    it("should add element to checkable set on registration", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })

      const entry = getEntry(manager, element)
      // Element should be checkable: visible (mocked), active, not predicted
      expect(entry.state.isActive).toBe(true)
      expect(entry.state.isPredicted).toBe(false)
    })

    it("should remove from checkable set when callback starts running", async () => {
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

    it("should update checkable status via public method", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })
      const entry = getEntry(manager, element)

      expect(entry.state.isActive).toBe(true)

      // @ts-expect-error - accessing private method
      manager.updateElementState(entry, { isIntersectingWithViewport: false })
      manager.updateCheckableStatus(entry)

      expect(entry.state.isIntersectingWithViewport).toBe(false)
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
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const listener = vi.fn()

      manager.register({ element, callback: vi.fn() })
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
      vi.useRealTimers()
      const manager = ForesightManager.initialize({ enableTabPrediction: false })
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })

      // Wait for handler to load first
      await vi.waitFor(() => {
        expect(manager.getManagerData.loadedModules.desktopHandler).toBe(true)
      })

      // Tab predictor should still be false
      expect(manager.getManagerData.loadedModules.predictors.tab).toBe(false)
      vi.useFakeTimers()
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
      vi.useRealTimers()
      const manager = ForesightManager.initialize({ enableScrollPrediction: false })
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })

      // Wait for handler to load first
      await vi.waitFor(() => {
        expect(manager.getManagerData.loadedModules.desktopHandler).toBe(true)
      })

      // Scroll predictor should still be false
      expect(manager.getManagerData.loadedModules.predictors.scroll).toBe(false)
      vi.useFakeTimers()
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
          expect(state?.elementBounds.hitSlop).toEqual({
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
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const listener = vi.fn()

      const result = manager.register({ element, callback: vi.fn() })
      result.subscribe(listener)

      fire(manager, getEntry(manager, element))
      // markElementAsRunning triggers a state update (isPredicted: true)
      expect(listener).toHaveBeenCalled()
    })

    it("should stop notifying after unsubscribe", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const listener = vi.fn()

      const result = manager.register({ element, callback: vi.fn() })
      const unsubscribe = result.subscribe(listener)

      unsubscribe()

      fire(manager, getEntry(manager, element))
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
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      const result = manager.register({ element, callback: vi.fn(), reactivateAfter: Infinity })
      const entry = getEntry(manager, element)

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
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      const result = manager.register({ element, callback: vi.fn(), reactivateAfter: Infinity })
      const entry = getEntry(manager, element)

      const unsub = result.subscribe(vi.fn())
      unsub()

      fire(manager, entry)
      await vi.runAllTimersAsync()

      // Resubscribe — getSnapshot must reflect state that changed while unsubscribed
      const listener = vi.fn()
      result.subscribe(listener)

      expect(result.getSnapshot().isActive).toBe(false)
      expect(result.getSnapshot().status).toBe("success")
    })

    it("should clear subscribers on unregister", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const listener = vi.fn()

      const result = manager.register({ element, callback: vi.fn() })
      result.subscribe(listener)

      manager.unregister(element)

      // The unregister itself triggers a state update — listener is notified
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

  describe("Re-registration Updates Options", () => {
    it("should update reactivateAfter on re-registration", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), reactivateAfter: 5000 })
      expect(manager.registeredElements.get(element)?.reactivateAfter).toBe(5000)

      manager.register({ element, callback: vi.fn(), reactivateAfter: 1000 })
      expect(manager.registeredElements.get(element)?.reactivateAfter).toBe(1000)
    })

    it("should update callback on re-registration", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const callbackA = vi.fn()
      const callbackB = vi.fn()

      manager.register({ element, callback: callbackA, reactivateAfter: 500 })
      const entry = getEntry(manager, element)

      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      expect(callbackA).toHaveBeenCalledTimes(1)

      // Reactivate, re-register with new callback, then fire again
      await vi.advanceTimersByTimeAsync(500)
      manager.register({ element, callback: callbackB })

      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      expect(callbackA).toHaveBeenCalledTimes(1)
      expect(callbackB).toHaveBeenCalledTimes(1)
    })

    it("should update name on re-registration", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), name: "old-name" })
      expect(manager.registeredElements.get(element)?.name).toBe("old-name")

      manager.register({ element, callback: vi.fn(), name: "new-name" })
      expect(manager.registeredElements.get(element)?.name).toBe("new-name")
    })

    it("should update meta on re-registration", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), meta: { route: "/a" } })
      expect(manager.registeredElements.get(element)?.meta).toEqual({ route: "/a" })

      manager.register({ element, callback: vi.fn(), meta: { route: "/b", priority: 1 } })
      expect(manager.registeredElements.get(element)?.meta).toEqual({ route: "/b", priority: 1 })
    })

    it("should preserve previous values when options are omitted on re-registration", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({
        element,
        callback: vi.fn(),
        name: "my-name",
        reactivateAfter: 3000,
        meta: { x: 1 },
      })

      // Re-register without name, meta, or reactivateAfter
      manager.register({ element, callback: vi.fn() })

      const state = manager.registeredElements.get(element)!
      expect(state.name).toBe("my-name")
      expect(state.reactivateAfter).toBe(3000)
      expect(state.meta).toEqual({ x: 1 })
    })

    it("should reschedule pending reactivation timeout when reactivateAfter changes", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const reactivatedListener = vi.fn()

      manager.addEventListener("elementReactivated", reactivatedListener)
      manager.register({ element, callback: vi.fn(), reactivateAfter: 5000 })
      const entry = getEntry(manager, element)

      // Fire callback to start the reactivation timer
      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      expect(entry.state.isActive).toBe(false)

      // Re-register with shorter reactivateAfter while timer is pending
      manager.register({ element, callback: vi.fn(), reactivateAfter: 500 })
      expect(entry.state.reactivateAfter).toBe(500)

      // Original 5000ms timer should have been cleared
      await vi.advanceTimersByTimeAsync(500)
      expect(reactivatedListener).toHaveBeenCalledTimes(1)
      expect(entry.state.isActive).toBe(true)
    })

    it("should cancel reactivation when re-registered with Infinity", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const reactivatedListener = vi.fn()

      manager.addEventListener("elementReactivated", reactivatedListener)
      manager.register({ element, callback: vi.fn(), reactivateAfter: 2000 })
      const entry = getEntry(manager, element)

      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      expect(entry.state.isActive).toBe(false)

      // Re-register with Infinity — should cancel the pending timeout
      manager.register({ element, callback: vi.fn(), reactivateAfter: Infinity })

      await vi.advanceTimersByTimeAsync(10000)
      expect(reactivatedListener).not.toHaveBeenCalled()
      expect(entry.state.isActive).toBe(false)
    })

    it("should not reschedule when there is no pending reactivation timeout", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const reactivatedListener = vi.fn()

      manager.addEventListener("elementReactivated", reactivatedListener)
      manager.register({ element, callback: vi.fn(), reactivateAfter: 5000 })

      // Element is still active (no callback fired yet), no pending timeout
      manager.register({ element, callback: vi.fn(), reactivateAfter: 100 })

      // No spurious reactivation should happen
      await vi.advanceTimersByTimeAsync(200)
      expect(reactivatedListener).not.toHaveBeenCalled()
    })

    it("should notify subscribers when options change on re-registration", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      const listener = vi.fn()

      const result = manager.register({ element, callback: vi.fn(), reactivateAfter: 5000 })
      result.subscribe(listener)

      manager.register({ element, callback: vi.fn(), reactivateAfter: 1000 })

      expect(listener).toHaveBeenCalled()
    })
  })

  describe("Element State Lifecycle", () => {
    function expectState(
      state: ForesightElementState,
      expected: { isPredicted: boolean; isCallbackRunning: boolean; isActive: boolean }
    ) {
      expect(state.isPredicted).toBe(expected.isPredicted)
      expect(state.isCallbackRunning).toBe(expected.isCallbackRunning)
      expect(state.isActive).toBe(expected.isActive)
    }

    it("full lifecycle: register → predict → complete → reactivate", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      let resolveCallback!: () => void
      const callback = vi.fn(() => new Promise<void>(resolve => (resolveCallback = resolve)))

      manager.register({ element, callback, reactivateAfter: 1000 })
      const entry = getEntry(manager, element)

      // 1. Registered: not predicted, not running, active
      expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: true })

      // 2. Prediction hit: predicted, running, active
      fire(manager, entry)
      expectState(entry.state, { isPredicted: true, isCallbackRunning: true, isActive: true })

      // 3. Callback completes: predicted, not running, not active
      resolveCallback()
      await vi.advanceTimersByTimeAsync(0) // flush microtask only, not reactivation timer
      expectState(entry.state, { isPredicted: true, isCallbackRunning: false, isActive: false })

      // 4. Reactivated: not predicted, not running, active
      await vi.advanceTimersByTimeAsync(1000)
      expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: true })
    })

    it("lifecycle ending in unregister instead of reactivation", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), reactivateAfter: Infinity })
      const entry = getEntry(manager, element)

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
      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      expectState(entry.state, { isPredicted: true, isCallbackRunning: false, isActive: false })

      await vi.advanceTimersByTimeAsync(500)
      expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: true })

      // Second cycle
      fire(manager, entry)
      await vi.advanceTimersByTimeAsync(0)
      expectState(entry.state, { isPredicted: true, isCallbackRunning: false, isActive: false })

      await vi.advanceTimersByTimeAsync(500)
      expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: true })

      expect(callback).toHaveBeenCalledTimes(2)
      expect(entry.state.hitCount).toBe(2)
    })

    it("isPredicted stays true while async callback is in flight", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      let resolveCallback!: () => void
      const callback = vi.fn(() => new Promise<void>(resolve => (resolveCallback = resolve)))

      manager.register({ element, callback, reactivateAfter: Infinity })
      const entry = getEntry(manager, element)

      fire(manager, entry)
      expectState(entry.state, { isPredicted: true, isCallbackRunning: true, isActive: true })

      // Advance time but callback hasn't resolved
      await vi.advanceTimersByTimeAsync(5000)
      expectState(entry.state, { isPredicted: true, isCallbackRunning: true, isActive: true })

      // Now resolve it
      resolveCallback()
      await vi.runAllTimersAsync()
      expectState(entry.state, { isPredicted: true, isCallbackRunning: false, isActive: false })
    })

    it("cannot fire during callback execution", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      let resolveCallback!: () => void
      const callback = vi.fn(() => new Promise<void>(resolve => (resolveCallback = resolve)))

      manager.register({ element, callback, reactivateAfter: Infinity })
      const entry = getEntry(manager, element)

      fire(manager, entry)
      fire(manager, entry) // ignored
      fire(manager, entry) // ignored

      resolveCallback()
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
      const manager = ForesightManager.initialize()
      const element = createMockElement()
      let resolveCallback!: () => void
      const callback = vi.fn(() => new Promise<void>(resolve => (resolveCallback = resolve)))

      manager.register({ element, callback, reactivateAfter: Infinity })
      const entry = getEntry(manager, element)

      fire(manager, entry)
      expectState(entry.state, { isPredicted: true, isCallbackRunning: true, isActive: true })

      manager.unregister(element)
      expectState(entry.state, { isPredicted: false, isCallbackRunning: false, isActive: false })
      expect(entry.state.isRegistered).toBe(false)

      resolveCallback()
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
})
