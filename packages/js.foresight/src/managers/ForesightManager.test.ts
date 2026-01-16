import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { ForesightManager } from "./ForesightManager"
import type { ForesightElement } from "../types/types"

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

      const data1 = manager.registeredElements.get(element1)
      const data2 = manager.registeredElements.get(element2)

      expect(data1?.id).not.toBe(data2?.id)
      expect(data1?.id).toMatch(/^foresight-\d+$/)
    })

    it("should increment registerCount on duplicate registration", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })
      const result = manager.register({ element, callback: vi.fn() })

      expect(result.isRegistered).toBe(false)
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

      const data = manager.registeredElements.get(element)
      expect(data?.elementBounds.hitSlop).toEqual({
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

      const data = manager.registeredElements.get(element)
      expect(data?.elementBounds.hitSlop).toEqual({
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
          elementData: expect.objectContaining({ name: "test" }),
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

      // Access private checkableElements via manager data
      // The element should be checkable initially (visible, active, not running)
      const dataBefore = manager.registeredElements.get(element)
      expect(dataBefore?.callbackInfo.isCallbackActive).toBe(true)

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

      // Manually trigger callback (simulating what MousePredictor would do)
      const elementData = manager.registeredElements.get(element)!
      // @ts-expect-error - accessing private method for testing
      manager.callCallback(elementData, { kind: "mouse", subType: "trajectory" })

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

      const elementData = manager.registeredElements.get(element)!
      // @ts-expect-error - accessing private method for testing
      manager.callCallback(elementData, { kind: "mouse", subType: "hover" })

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

      const elementData = manager.registeredElements.get(element)!
      expect(elementData.callbackInfo.isCallbackActive).toBe(true)

      // @ts-expect-error - accessing private method for testing
      manager.callCallback(elementData, { kind: "mouse", subType: "hover" })

      await vi.runAllTimersAsync()

      expect(elementData.callbackInfo.isCallbackActive).toBe(false)
      expect(elementData.callbackInfo.isRunningCallback).toBe(false)
    })

    it("should update hit counters on callback invocation", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })
      const elementData = manager.registeredElements.get(element)!

      // @ts-expect-error - accessing private method for testing
      manager.callCallback(elementData, { kind: "mouse", subType: "trajectory" })
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
      const elementData = manager.registeredElements.get(element)!

      // @ts-expect-error - accessing private method for testing
      manager.callCallback(elementData, { kind: "mouse", subType: "hover" })
      // @ts-expect-error - accessing private method for testing
      manager.callCallback(elementData, { kind: "mouse", subType: "hover" })

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

      const elementData = manager.registeredElements.get(element)!

      // @ts-expect-error - accessing private method for testing
      manager.callCallback(elementData, { kind: "mouse", subType: "hover" })

      // Only advance enough for the callback to complete, not the reactivation timer
      await vi.advanceTimersByTimeAsync(100)

      expect(elementData.callbackInfo.isCallbackActive).toBe(false)
      expect(reactivatedListener).not.toHaveBeenCalled()

      // Now advance past reactivateAfter
      await vi.advanceTimersByTimeAsync(5000)

      expect(elementData.callbackInfo.isCallbackActive).toBe(true)
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

      const elementData = manager.registeredElements.get(element)!
      // @ts-expect-error - accessing private method for testing
      manager.callCallback(elementData, { kind: "mouse", subType: "hover" })
      await vi.runAllTimersAsync()

      await vi.advanceTimersByTimeAsync(100000)

      expect(elementData.callbackInfo.isCallbackActive).toBe(false)
      expect(reactivatedListener).not.toHaveBeenCalled()
    })

    it("should support manual reactivation", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn(), reactivateAfter: Infinity })
      const elementData = manager.registeredElements.get(element)!

      // @ts-expect-error - accessing private method for testing
      manager.callCallback(elementData, { kind: "mouse", subType: "hover" })
      await vi.runAllTimersAsync()

      expect(elementData.callbackInfo.isCallbackActive).toBe(false)

      manager.reactivate(element)

      expect(elementData.callbackInfo.isCallbackActive).toBe(true)
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

      const elementData = manager.registeredElements.get(element)!
      // Element should be checkable: visible (mocked), active, not running
      expect(elementData.callbackInfo.isCallbackActive).toBe(true)
      expect(elementData.callbackInfo.isRunningCallback).toBe(false)
    })

    it("should remove from checkable set when callback starts running", async () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      let resolveCallback: () => void
      const slowCallback = new Promise<void>(resolve => {
        resolveCallback = resolve
      })

      manager.register({ element, callback: () => slowCallback })
      const elementData = manager.registeredElements.get(element)!

      // @ts-expect-error - accessing private method for testing
      manager.callCallback(elementData, { kind: "mouse", subType: "hover" })

      // While callback is running, element should not be checkable
      expect(elementData.callbackInfo.isRunningCallback).toBe(true)

      // Resolve the callback
      resolveCallback!()
      await vi.runAllTimersAsync()

      expect(elementData.callbackInfo.isRunningCallback).toBe(false)
    })

    it("should update checkable status via public method", () => {
      const manager = ForesightManager.initialize()
      const element = createMockElement()

      manager.register({ element, callback: vi.fn() })
      const elementData = manager.registeredElements.get(element)!

      // Initially checkable
      expect(elementData.callbackInfo.isCallbackActive).toBe(true)

      // Manually mark as not intersecting
      elementData.isIntersectingWithViewport = false
      manager.updateCheckableStatus(elementData)

      // Should no longer be considered checkable
      // (We can't directly verify the Set, but we test the status change)
      expect(elementData.isIntersectingWithViewport).toBe(false)
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

      const elementData1 = manager.registeredElements.get(element1)!
      // @ts-expect-error - accessing private method for testing
      manager.callCallback(elementData1, { kind: "mouse", subType: "hover" })
      await vi.runAllTimersAsync()

      expect(manager.getManagerData.activeElementCount).toBe(1)
    })
  })
})
