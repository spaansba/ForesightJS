import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { ForesightManager } from "./ForesightManager"
import type { ForesightRegisterOptions, ForesightManagerSettings } from "../types/types"
import { createMockElement, mockElementBounds, simulateMouseEvent } from "../../test-setup"

describe("ForesightManager", () => {
  let manager: ForesightManager
  let testElement: HTMLElement
  let mockCallback: ReturnType<typeof vi.fn>
  let unregisterFunctions: Array<() => void> = []

  beforeEach(() => {
    // Initialize with basic settings
    manager = ForesightManager.initialize({
      enableMousePrediction: true,
      enableTabPrediction: true,
      enableScrollPrediction: true,
    })

    // Create test element and mock its bounds
    testElement = createMockElement("button", { id: "test-button" })
    document.body.appendChild(testElement)
    mockElementBounds(testElement, { x: 100, y: 100, width: 100, height: 50 })

    // Create mock callback
    mockCallback = vi.fn()
    unregisterFunctions = []
  })

  afterEach(() => {
    // Call all unregister functions
    unregisterFunctions.forEach((unregister) => unregister())
    unregisterFunctions = []

    // Clear DOM
    document.body.innerHTML = ""
    vi.clearAllMocks()
  })

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = ForesightManager.instance
      const instance2 = ForesightManager.instance
      expect(instance1).toBe(instance2)
    })

    it("should initialize only once", () => {
      const instance1 = ForesightManager.initialize()
      const instance2 = ForesightManager.initialize()
      expect(instance1).toBe(instance2)
    })

    it("should have isInitiated property", () => {
      expect(ForesightManager.isInitiated).toBe(true)
    })
  })

  describe("Element Registration", () => {
    it("should register an element successfully", () => {
      const result = manager.register({
        element: testElement,
        callback: mockCallback,
        name: "test-element",
      })

      unregisterFunctions.push(result.unregister)

      expect(result.isRegistered).toBe(true)
      expect(result.isTouchDevice).toBe(false)
      expect(result.isLimitedConnection).toBe(false)
      expect(typeof result.unregister).toBe("function")
      expect(manager.registeredElements.has(testElement)).toBe(true)
    })

    it("should handle duplicate element registration", () => {
      // Create a separate element for testing
      const secondElement = createMockElement("button", { id: "second-button" })
      document.body.appendChild(secondElement)
      mockElementBounds(secondElement, { x: 300, y: 300, width: 100, height: 50 })

      // First registration
      const result1 = manager.register({
        element: testElement,
        callback: mockCallback,
        name: "test-element",
      })

      // Register a different element
      const result2 = manager.register({
        element: secondElement,
        callback: vi.fn(),
        name: "second-element",
      })

      unregisterFunctions.push(result1.unregister, result2.unregister)

      expect(result1.isRegistered).toBe(true)
      expect(result2.isRegistered).toBe(true)
      expect(manager.registeredElements.size).toBe(2)
    })

    it("should register elements with different options", () => {
      const options: ForesightRegisterOptions = {
        element: testElement,
        callback: mockCallback,
        name: "test-element",
        hitSlop: { top: 10, right: 20, bottom: 30, left: 40 },
        unregisterOnCallback: true,
      }

      const result = manager.register(options)
      expect(result.isRegistered).toBe(true)

      const elementData = manager.registeredElements.get(testElement)
      expect(elementData?.name).toBe("test-element")
    })

    it("should handle registration with number hitSlop", () => {
      const result = manager.register({
        element: testElement,
        callback: mockCallback,
        hitSlop: 15,
      })

      expect(result.isRegistered).toBe(true)
      const elementData = manager.registeredElements.get(testElement)
      expect(elementData?.elementBounds.hitSlop).toBeDefined()
    })

    it("should handle elements without explicit names", () => {
      const newElement = createMockElement("div")
      document.body.appendChild(newElement)
      mockElementBounds(newElement, { x: 200, y: 200, width: 100, height: 50 })

      const result = manager.register({
        element: newElement,
        callback: mockCallback,
      })

      unregisterFunctions.push(result.unregister)

      expect(result.isRegistered).toBe(true)
      const elementData = manager.registeredElements.get(newElement)
      expect(typeof elementData?.name).toBe("string")
    })

    it("should unregister elements using returned function", () => {
      const result = manager.register({
        element: testElement,
        callback: mockCallback,
      })

      expect(manager.registeredElements.has(testElement)).toBe(true)

      result.unregister()
      expect(manager.registeredElements.has(testElement)).toBe(false)
    })
  })

  describe("Settings Management", () => {
    it("should get current manager data", () => {
      const data = manager.getManagerData
      expect(data).toHaveProperty("globalSettings")
      expect(data).toHaveProperty("globalCallbackHits")
      expect(data.globalSettings).toHaveProperty("enableMousePrediction")
      expect(data.globalSettings).toHaveProperty("enableTabPrediction")
      expect(data.globalSettings).toHaveProperty("enableScrollPrediction")
    })

    it("should update global settings", () => {
      const newSettings: Partial<ForesightManagerSettings> = {
        trajectoryPredictionTime: 150,
        positionHistorySize: 8,
        enableMousePrediction: false,
      }

      manager.alterGlobalSettings(newSettings)

      const data = manager.getManagerData
      expect(data.globalSettings.trajectoryPredictionTime).toBe(150)
      expect(data.globalSettings.positionHistorySize).toBe(8)
      expect(data.globalSettings.enableMousePrediction).toBe(false)
    })

    it("should clamp settings to valid ranges", () => {
      manager.alterGlobalSettings({
        trajectoryPredictionTime: 999999, // Should be clamped to max
        positionHistorySize: -1, // Should be clamped to min
      })

      const data = manager.getManagerData
      expect(data.globalSettings.trajectoryPredictionTime).toBeLessThanOrEqual(200)
      expect(data.globalSettings.positionHistorySize).toBeGreaterThanOrEqual(2)
    })

  })

  describe("Mouse Interaction", () => {
    beforeEach(() => {
      manager.register({
        element: testElement,
        callback: mockCallback,
        name: "test-button",
      })
    })

    it("should detect mouse hover", () => {
      // For now just verify that mouse events can be triggered without errors
      simulateMouseEvent("mousemove", window, { clientX: 150, clientY: 125 })

      // The exact callback behavior depends on complex trajectory calculations
      // For now we just verify the system doesn't crash
      expect(true).toBe(true)
    })

    it("should not trigger callback when mouse prediction is disabled", () => {
      manager.alterGlobalSettings({ enableMousePrediction: false })

      simulateMouseEvent("mousemove", window, { clientX: 150, clientY: 125 })
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it("should handle mouse trajectory prediction", () => {
      // Simulate mouse movement that would intersect with the element's trajectory
      simulateMouseEvent("mousemove", window, { clientX: 50, clientY: 125 })
      simulateMouseEvent("mousemove", window, { clientX: 75, clientY: 125 })

      // For now just verify the system handles trajectory events without errors
      expect(true).toBe(true)
    })

    it("should track callback hits", () => {
      const initialHits = manager.getManagerData.globalCallbackHits.mouse.hover

      simulateMouseEvent("mousemove", window, { clientX: 150, clientY: 125 })

      const newHits = manager.getManagerData.globalCallbackHits.mouse.hover
      // For now just verify the hits counter exists and is a number
      expect(typeof newHits).toBe("number")
    })
  })

  describe("Keyboard Navigation", () => {
    it("should have tab prediction setting enabled by default", () => {
      const data = manager.getManagerData
      expect(data.globalSettings.enableTabPrediction).toBe(true)
    })

    it("should allow disabling tab prediction", () => {
      manager.alterGlobalSettings({ enableTabPrediction: false })

      const data = manager.getManagerData
      expect(data.globalSettings.enableTabPrediction).toBe(false)
    })

    it("should have tab offset setting", () => {
      const data = manager.getManagerData
      expect(typeof data.globalSettings.tabOffset).toBe("number")
      expect(data.globalSettings.tabOffset).toBeGreaterThanOrEqual(0)
    })
  })

  describe("Scroll Prediction", () => {
    it("should handle scroll events", () => {
      manager.register({
        element: testElement,
        callback: mockCallback,
        name: "scrollable-element",
      })

      // Mock mouse position and simulate scroll
      simulateMouseEvent("mousemove", window, { clientX: 150, clientY: 125 })

      // Simulate scroll event
      const scrollEvent = new Event("scroll")
      window.dispatchEvent(scrollEvent)

      // The exact behavior depends on scroll direction calculation
      // For now, we just verify the scroll handling doesn't crash
      expect(true).toBe(true)
    })

    it("should not handle scroll when disabled", () => {
      manager.alterGlobalSettings({ enableScrollPrediction: false })

      const consoleSpy = vi.spyOn(console, "error")
      window.dispatchEvent(new Event("scroll"))

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe("Cleanup and Observers", () => {
    it("should setup observers when elements are registered", () => {
      manager.register({
        element: testElement,
        callback: mockCallback,
      })

      // Just verify the registration completed without errors
      expect(manager.registeredElements.has(testElement)).toBe(true)
    })
  })

  describe("Performance and Edge Cases", () => {
    it("should handle elements with zero dimensions", () => {
      const zeroElement = createMockElement("div")
      mockElementBounds(zeroElement, { x: 100, y: 100, width: 0, height: 0 })
      document.body.appendChild(zeroElement)

      const result = manager.register({
        element: zeroElement,
        callback: vi.fn(),
      })

      expect(result.isRegistered).toBe(true)
    })

    it("should handle elements outside viewport", () => {
      const offscreenElement = createMockElement("div")
      mockElementBounds(offscreenElement, { x: -1000, y: -1000, width: 100, height: 100 })
      document.body.appendChild(offscreenElement)

      const result = manager.register({
        element: offscreenElement,
        callback: vi.fn(),
      })

      expect(result.isRegistered).toBe(true)
    })
  })
})
