import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PositionObserverEntry, type PositionObserverCallback } from "position-observer"
import type { ForesightManager as ForesightManagerClass } from "./ForesightManager"
import type {
  ForesightCallback,
  ForesightElement,
  ForesightElementState,
  ForesightRegisterOptionsWithoutElement,
} from "../types/types"

const device = vi.hoisted(() => ({
  hasConnectionLimitations: vi.fn(() => false),
  userUsesTouchDevice: vi.fn(() => false),
}))
vi.mock("../helpers/shouldRegister", () => device)

const positionObservers = vi.hoisted(() => new Set<PositionObserverCallback>())
vi.mock("position-observer", async importOriginal => ({
  ...(await importOriginal<typeof import("position-observer")>()),
  PositionObserver: class {
    constructor(private callback: PositionObserverCallback) {
      positionObservers.add(callback)
    }
    observe() {}
    unobserve() {}
    disconnect() {
      positionObservers.delete(this.callback)
    }
  },
}))

let ForesightManager: typeof ForesightManagerClass

const rectAt = (left = 100, top = 100) => new DOMRect(left, top, 100, 100)

const createElement = (id = "test-element", rect = rectAt()) => {
  const element = document.createElement("button")
  element.id = id
  element.getBoundingClientRect = () => rect
  element.getClientRects = () => ({ length: 1 }) as DOMRectList
  document.body.appendChild(element)

  return element
}

const createNodeList = (count: number) => {
  const container = document.createElement("div")
  document.body.appendChild(container)
  for (let i = 0; i < count; i++) {
    const element = createElement(`item-${i}`, rectAt(100 + i * 300))
    element.classList.add("foresight-item")
    container.appendChild(element)
  }

  return container.querySelectorAll<ForesightElement>(".foresight-item")
}

const setup = (options: Partial<ForesightRegisterOptionsWithoutElement> = {}) => {
  const manager = ForesightManager.initialize()
  const element = createElement()
  const callback = vi.fn<ForesightCallback>()
  const result = manager.register({ element, callback, ...options })

  return { manager, element, callback, result, state: () => result.getSnapshot() }
}

const countElements = (manager: ForesightManagerClass, flag: "isActive" | "isParked") =>
  [...manager.registeredElements.values()].filter(state => state[flag]).length

const deferredCallback = () => {
  let resolve!: () => void
  const callback = vi.fn<ForesightCallback>(() => new Promise<void>(r => (resolve = r)))

  return { callback, resolve: () => resolve() }
}

const settle = async () => {
  await vi.dynamicImportSettled()
  await vi.advanceTimersByTimeAsync(0)
}

const pointerMove = (
  clientX: number,
  clientY: number,
  pointerType = "mouse",
  timeStamp?: number
) => {
  const event = new PointerEvent("pointermove", { clientX, clientY, pointerType })
  if (timeStamp !== undefined) {
    Object.defineProperty(event, "timeStamp", { value: timeStamp })
  }

  document.dispatchEvent(event)
  vi.advanceTimersToNextFrame()
}

const hover = async (element: Element) => {
  await settle()
  const { left, top } = element.getBoundingClientRect()
  pointerMove(left + 50, top + 50)
}

const tabTo = async (element: HTMLElement) => {
  await settle()
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }))
  element.focus()
}

const reportPosition = (element: Element, rect: DOMRect, isIntersecting = true) => {
  const entry = new PositionObserverEntry(element, rect, rect, isIntersecting, rectAt(0, 0))
  positionObservers.forEach(callback => callback([entry]))
}

const isListening = async (manager: ForesightManagerClass) => {
  const listener = vi.fn()
  manager.addEventListener("mouseTrajectoryUpdate", listener)
  await settle()
  pointerMove(1000, 700)
  manager.removeEventListener("mouseTrajectoryUpdate", listener)

  return listener.mock.calls.length > 0
}

const expectState = (
  state: ForesightElementState,
  expected: Pick<ForesightElementState, "isPredicted" | "isCallbackRunning" | "isActive">
) => expect(state).toMatchObject(expected)

describe("ForesightManager", () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    positionObservers.clear()
    vi.resetModules()
    ;({ ForesightManager } = await import("./ForesightManager"))
  })

  afterEach(() => {
    const manager = ForesightManager.instance
    for (const element of [...manager.registeredElements.keys()]) {
      manager.unregister(element)
    }
    document.body.innerHTML = ""
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe("Singleton", () => {
    it("returns one instance from initialize and instance", () => {
      expect(ForesightManager.isInitiated).toBe(false)

      const manager = ForesightManager.initialize()

      expect(ForesightManager.isInitiated).toBe(true)
      expect(ForesightManager.initialize()).toBe(manager)
      expect(ForesightManager.instance).toBe(manager)
    })

    it("applies settings from the first initialization only", () => {
      ForesightManager.initialize({ trajectoryPredictionTime: 150, enableMousePrediction: false })
      ForesightManager.initialize({ trajectoryPredictionTime: 50 })

      const { globalSettings } = ForesightManager.instance.getManagerData
      expect(globalSettings.trajectoryPredictionTime).toBe(150)
      expect(globalSettings.enableMousePrediction).toBe(false)
    })
  })

  describe("Registration", () => {
    it("registers an element with a unique id", () => {
      const manager = ForesightManager.initialize()
      const element1 = createElement("el1")
      const element2 = createElement("el2")

      const result = manager.register({ element: element1, callback: vi.fn() })
      manager.register({ element: element2, callback: vi.fn() })

      expect(result.isRegistered).toBe(true)
      expect(manager.registeredElements.size).toBe(2)
      expect(manager.registeredElements.get(element1)?.id).toMatch(/^foresight-\d+$/)
      expect(manager.registeredElements.get(element1)?.id).not.toBe(
        manager.registeredElements.get(element2)?.id
      )
    })

    it("names the element after its id unless a name is given", () => {
      const manager = ForesightManager.initialize()
      const unnamed = createElement("my-button")
      const named = createElement("other")

      manager.register({ element: unnamed, callback: vi.fn() })
      manager.register({ element: named, callback: vi.fn(), name: "Custom Name" })

      expect(manager.registeredElements.get(unnamed)?.name).toBe("my-button")
      expect(manager.registeredElements.get(named)?.name).toBe("Custom Name")
    })

    it("stores meta", () => {
      const meta = { route: "/dashboard", priority: 1 }
      const { state } = setup({ meta })

      expect(state().meta).toEqual(meta)
    })

    it.each([
      [15, { top: 15, left: 15, right: 15, bottom: 15 }],
      [
        { top: 10, left: 20, right: 30, bottom: 40 },
        { top: 10, left: 20, right: 30, bottom: 40 },
      ],
    ])("normalizes hitSlop %o", (hitSlop, expected) => {
      const { state } = setup({ hitSlop })

      expect(state().hitSlop).toEqual(expected)
    })

    it("emits elementRegistered", () => {
      const manager = ForesightManager.initialize()
      const listener = vi.fn()

      manager.addEventListener("elementRegistered", listener)
      manager.register({ element: createElement(), callback: vi.fn(), name: "test" })

      expect(listener).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          type: "elementRegistered",
          state: expect.objectContaining({ name: "test" }),
        })
      )
    })
  })

  describe("Unregistration", () => {
    it("unregisters an element and emits elementUnregistered with the reason", () => {
      const { manager, element, state } = setup()
      const listener = vi.fn()

      manager.addEventListener("elementUnregistered", listener)
      manager.unregister(element, "apiCall")

      expect(manager.registeredElements.has(element)).toBe(false)
      expect(state().isRegistered).toBe(false)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "elementUnregistered",
          unregisterReason: "apiCall",
          wasLastRegisteredElement: true,
        })
      )
    })

    it("ignores elements that are not registered", () => {
      const manager = ForesightManager.initialize()

      expect(() => manager.unregister(createElement())).not.toThrow()
    })

    it("unregisters through any result of an element that was registered again to update it", () => {
      const { manager, element, result } = setup({ name: "v1" })
      manager.register({ element, callback: vi.fn(), name: "v2" })

      result.unregister()

      expect(manager.registeredElements.has(element)).toBe(false)
    })

    it("a stale result does not unregister a later registration of the same element", () => {
      const { manager, element, result: stale } = setup()
      manager.unregister(element)
      manager.register({ element, callback: vi.fn() })

      stale.unregister()

      expect(manager.registeredElements.has(element)).toBe(true)
    })
  })

  describe("Data attributes", () => {
    it("does not touch the DOM when disabled globally", async () => {
      ForesightManager.initialize({ setDataAttributes: false })
      const { element } = setup()

      await hover(element)
      await settle()

      expect(element.getAttributeNames()).toEqual(["id"])
    })

    it("mirrors state onto data-* attributes by default", async () => {
      const { element } = setup()

      expect(element.hasAttribute("data-active")).toBe(true)
      expect(element.hasAttribute("data-predicted")).toBe(false)

      await hover(element)
      await settle()

      expect(element.hasAttribute("data-predicted")).toBe(true)
      expect(element.getAttribute("data-status")).toBe("success")
      expect(element.hasAttribute("data-active")).toBe(false)
    })

    it("removes all data-* attributes on unregister", async () => {
      const { manager, element } = setup()
      await hover(element)
      await settle()

      manager.unregister(element)

      expect(element.getAttributeNames()).toEqual(["id"])
    })

    it("applies and removes attributes on all elements when toggled at runtime", async () => {
      const { manager, element } = setup()
      await hover(element)
      await settle()

      manager.alterGlobalSettings({ setDataAttributes: false })
      expect(element.hasAttribute("data-predicted")).toBe(false)

      manager.alterGlobalSettings({ setDataAttributes: true })
      expect(element.hasAttribute("data-predicted")).toBe(true)
    })
  })

  describe("Event listeners", () => {
    it("adds, reports and removes listeners", () => {
      const manager = ForesightManager.initialize()
      const listener = vi.fn()

      expect(manager.hasListeners("elementRegistered")).toBe(false)
      manager.addEventListener("elementRegistered", listener)
      expect(manager.hasListeners("elementRegistered")).toBe(true)

      manager.register({ element: createElement("e1"), callback: vi.fn() })
      manager.removeEventListener("elementRegistered", listener)
      manager.register({ element: createElement("e2"), callback: vi.fn() })

      expect(listener).toHaveBeenCalledTimes(1)
      expect(manager.hasListeners("elementRegistered")).toBe(false)
    })

    it("removes listeners through an AbortSignal", () => {
      const manager = ForesightManager.initialize()
      const listener = vi.fn()
      const lateListener = vi.fn()
      const controller = new AbortController()

      manager.addEventListener("elementRegistered", listener, { signal: controller.signal })
      manager.register({ element: createElement("e1"), callback: vi.fn() })
      controller.abort()
      manager.addEventListener("elementRegistered", lateListener, { signal: controller.signal })
      manager.register({ element: createElement("e2"), callback: vi.fn() })

      expect(listener).toHaveBeenCalledTimes(1)
      expect(lateListener).not.toHaveBeenCalled()
    })

    it("keeps calling other listeners when one throws", () => {
      const manager = ForesightManager.initialize()
      vi.spyOn(console, "error").mockImplementation(() => {})
      const normalListener = vi.fn()

      manager.addEventListener("elementRegistered", () => {
        throw new Error("Listener error")
      })
      manager.addEventListener("elementRegistered", normalListener)
      manager.register({ element: createElement(), callback: vi.fn() })

      expect(normalListener).toHaveBeenCalledTimes(1)
    })
  })

  describe("Callbacks", () => {
    it("emits callbackInvoked and callbackCompleted with the hit type", async () => {
      const { manager, element, callback } = setup()
      const invoked = vi.fn()
      const completed = vi.fn()
      manager.addEventListener("callbackInvoked", invoked)
      manager.addEventListener("callbackCompleted", completed)

      await hover(element)
      await settle()

      const hitType = { kind: "mouse", subType: "trajectory" }
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ isPredicted: true }), {
        hitType,
      })
      expect(invoked).toHaveBeenCalledWith(expect.objectContaining({ hitType }))
      expect(completed).toHaveBeenCalledWith(
        expect.objectContaining({ hitType, status: "success", errorMessage: null })
      )
    })

    it("reports a hover hit when mouse prediction is off", async () => {
      ForesightManager.initialize({ enableMousePrediction: false })
      const { element, callback } = setup()

      await hover(element)

      expect(callback.mock.calls[0]?.[1].hitType).toEqual({ kind: "mouse", subType: "hover" })
    })

    it("reports callback errors and still reactivates", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {})
      const { manager, element, state } = setup({
        reactivateAfter: 1000,
        callback: () => {
          throw new Error("callback failed")
        },
      })
      const completed = vi.fn()
      manager.addEventListener("callbackCompleted", completed)

      await hover(element)
      await settle()

      expect(completed).toHaveBeenCalledWith(
        expect.objectContaining({ status: "error", errorMessage: "callback failed" })
      )
      expectState(state(), { isPredicted: true, isCallbackRunning: false, isActive: false })
      expect(state()).toMatchObject({ status: "error", error: "callback failed" })

      await vi.advanceTimersByTimeAsync(1000)
      expectState(state(), { isPredicted: false, isCallbackRunning: false, isActive: true })
    })
  })

  describe("Lifecycle", () => {
    it("register → predict → complete → reactivate", async () => {
      const { callback, resolve } = deferredCallback()
      const { element, state } = setup({ callback, reactivateAfter: 1000 })

      expectState(state(), { isPredicted: false, isCallbackRunning: false, isActive: true })

      await hover(element)
      expectState(state(), { isPredicted: true, isCallbackRunning: true, isActive: true })

      await vi.advanceTimersByTimeAsync(5000)
      expectState(state(), { isPredicted: true, isCallbackRunning: true, isActive: true })

      resolve()
      await vi.advanceTimersByTimeAsync(0)
      expectState(state(), { isPredicted: true, isCallbackRunning: false, isActive: false })

      await vi.advanceTimersByTimeAsync(1000)
      expectState(state(), { isPredicted: false, isCallbackRunning: false, isActive: true })
    })

    it("runs multiple cycles via timed reactivation", async () => {
      const { element, callback, state } = setup({ reactivateAfter: 500 })

      await hover(element)
      await vi.advanceTimersByTimeAsync(500)
      await hover(element)
      await vi.advanceTimersByTimeAsync(500)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(state().hitCount).toBe(2)
    })

    it("does not reactivate when reactivateAfter is Infinity", async () => {
      const { element, state } = setup()

      await hover(element)
      await vi.advanceTimersByTimeAsync(100_000)

      expect(state().isActive).toBe(false)
    })

    it("does not fire again while the callback runs or before reactivation", async () => {
      const { callback, resolve } = deferredCallback()
      const { element } = setup({ callback, reactivateAfter: 5000 })

      await hover(element)
      await hover(element)
      resolve()
      await settle()
      await hover(element)
      expect(callback).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(5000)
      await hover(element)
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it("reactivates manually", async () => {
      const { manager, element, callback, state } = setup()
      await hover(element)
      await settle()

      manager.reactivate(element)
      expectState(state(), { isPredicted: false, isCallbackRunning: false, isActive: true })

      await hover(element)
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it("ignores reactivate for elements that are not registered", () => {
      const manager = ForesightManager.initialize()

      expect(() => manager.reactivate(createElement())).not.toThrow()
    })

    it("resets all flags when unregistered mid-callback and leaves no attributes", async () => {
      const { callback, resolve } = deferredCallback()
      const { manager, element, state } = setup({ callback })

      await hover(element)
      manager.unregister(element)
      expectState(state(), { isPredicted: false, isCallbackRunning: false, isActive: false })

      resolve()
      await settle()
      expect(element.getAttributeNames()).toEqual(["id"])
    })

    it("does not reactivate a re-registration when an old callback completes", async () => {
      const { callback, resolve } = deferredCallback()
      const { manager, element } = setup({ callback, reactivateAfter: 1000 })

      await hover(element)
      manager.unregister(element)
      const next = manager.register({ element, callback: vi.fn() })
      await hover(element)
      await settle()
      expect(next.getSnapshot().isActive).toBe(false)

      resolve()
      await vi.advanceTimersByTimeAsync(1000)

      expect(next.getSnapshot().isActive).toBe(false)
    })

    it("tracks the active element count", async () => {
      const manager = ForesightManager.initialize()
      const first = createElement("first")
      manager.register({ element: first, callback: vi.fn() })
      manager.register({ element: createElement("other", rectAt(700)), callback: vi.fn() })
      expect(countElements(manager, "isActive")).toBe(2)

      await hover(first)
      await settle()

      expect(countElements(manager, "isActive")).toBe(1)
    })
  })

  describe("Viewport", () => {
    it("only predicts elements inside the viewport", async () => {
      const { element, callback, state } = setup()
      await settle()

      reportPosition(element, rectAt(), false)
      expect(state().isIntersectingWithViewport).toBe(false)
      await hover(element)
      expect(callback).not.toHaveBeenCalled()

      reportPosition(element, rectAt(), true)
      await hover(element)
      expect(callback).toHaveBeenCalled()
    })
  })

  describe("Settings", () => {
    it("clamps numeric settings to valid ranges", () => {
      const manager = ForesightManager.initialize({
        trajectoryPredictionTime: 500,
        scrollMargin: 1,
      })

      expect(manager.getManagerData.globalSettings).toMatchObject({
        trajectoryPredictionTime: 200,
        scrollMargin: 30,
      })
    })

    it("alters settings and emits managerSettingsChanged", () => {
      const manager = ForesightManager.initialize()
      const listener = vi.fn()

      manager.addEventListener("managerSettingsChanged", listener)
      manager.alterGlobalSettings({ trajectoryPredictionTime: 100, minimumConnectionType: "4g" })

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedSettings: [
            expect.objectContaining({ setting: "trajectoryPredictionTime", newValue: 100 }),
            { setting: "minimumConnectionType", oldValue: "3g", newValue: "4g" },
          ],
        })
      )
    })

    it("does not emit when nothing changed", () => {
      const manager = ForesightManager.initialize({ trajectoryPredictionTime: 120 })
      const listener = vi.fn()

      manager.addEventListener("managerSettingsChanged", listener)
      manager.alterGlobalSettings({ trajectoryPredictionTime: 120 })

      expect(listener).not.toHaveBeenCalled()
    })

    it("normalizes defaultHitSlop", () => {
      const manager = ForesightManager.initialize()

      manager.alterGlobalSettings({ defaultHitSlop: 50 })

      expect(manager.getManagerData.globalSettings.defaultHitSlop).toEqual({
        top: 50,
        left: 50,
        right: 50,
        bottom: 50,
      })
    })
  })

  describe("Lazy loading", () => {
    it("loads the desktop handler on first registration", async () => {
      const manager = ForesightManager.initialize()
      expect(manager["desktopHandler"]).toBeNull()
      expect(manager["touchDeviceHandler"]).toBeNull()

      manager.register({ element: createElement(), callback: vi.fn() })
      await settle()

      expect(manager["desktopHandler"]).not.toBeNull()
    })

    it("does not connect a handler that finished loading after teardown", async () => {
      const { manager, element } = setup()

      manager.unregister(element)
      await settle()

      expect(positionObservers.size).toBe(0)
    })

    it("only connects the latest device strategy when switching mid-load", async () => {
      const { manager, element, callback } = setup()
      await settle()

      pointerMove(-999, -999, "touch")
      pointerMove(-999, -999, "mouse")
      await settle()
      expect(manager["touchDeviceHandler"]).not.toBeNull()

      element.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch" }))
      expect(callback).not.toHaveBeenCalled()
    })

    it("predicts tab focus, also after the manager went idle", async () => {
      const manager = ForesightManager.initialize({ enableTabPrediction: true })
      const first = createElement("first")
      manager.register({ element: first, callback: vi.fn() })
      await settle()
      manager.unregister(first)

      const callback = vi.fn<ForesightCallback>()
      const second = createElement("second")
      manager.register({ element: second, callback })
      await tabTo(second)

      expect(callback.mock.calls[0]?.[1].hitType).toEqual({ kind: "tab", subType: "forwards" })
    })

    it("does not predict tab focus when tab prediction is disabled mid-load", async () => {
      ForesightManager.initialize({ enableTabPrediction: false })
      const { manager, element, callback } = setup()
      await settle()

      manager.alterGlobalSettings({ enableTabPrediction: true })
      manager.alterGlobalSettings({ enableTabPrediction: false })
      await tabTo(element)

      expect(callback).not.toHaveBeenCalled()
    })

    it("disconnects the previous touch predictor when the strategy changes", async () => {
      const intersectionObservers = new Set<object>()
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor() {
            intersectionObservers.add(this)
          }
          observe() {}
          unobserve() {}
          disconnect() {
            intersectionObservers.delete(this)
          }
        }
      )
      device.userUsesTouchDevice.mockReturnValueOnce(true)
      const manager = ForesightManager.initialize()
      const [first, second] = createNodeList(2)
      const callback = vi.fn<ForesightCallback>()
      manager.register({ element: first!, callback })
      manager.register({ element: second!, callback })
      await settle()

      first!.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch" }))
      expect(callback).toHaveBeenCalledTimes(1)

      manager.alterGlobalSettings({ touchDeviceStrategy: "viewport" })
      second!.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch" }))
      expect(callback).toHaveBeenCalledTimes(1)
      expect(intersectionObservers.size).toBe(1)

      manager.alterGlobalSettings({ touchDeviceStrategy: "none" })
      expect(intersectionObservers.size).toBe(0)
    })
  })

  describe("Pointer trajectory", () => {
    it("fires a trajectory hit for an element the pointer is moving towards", async () => {
      const { manager } = setup()
      const listener = vi.fn()
      manager.addEventListener("callbackInvoked", listener)
      await settle()

      pointerMove(0, 150, "mouse", 1000)
      expect(listener).not.toHaveBeenCalled()

      pointerMove(40, 150, "mouse", 1016)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ hitType: { kind: "mouse", subType: "trajectory" } })
      )
    })
  })

  describe("NodeList", () => {
    it("registers every element and returns a result per element", () => {
      const manager = ForesightManager.initialize()
      const listener = vi.fn()
      manager.addEventListener("elementRegistered", listener)

      const results = manager.register({
        element: createNodeList(3),
        callback: vi.fn(),
        hitSlop: 20,
      })

      expect(results).toHaveLength(3)
      expect(new Set(results.map(result => result.id)).size).toBe(3)
      expect(results.every(result => result.isRegistered)).toBe(true)
      expect(results[0]?.hitSlop).toEqual({ top: 20, left: 20, right: 20, bottom: 20 })
      expect(listener).toHaveBeenCalledTimes(3)
    })

    it("handles an empty NodeList", () => {
      const manager = ForesightManager.initialize()

      const results = manager.register({
        element: document.querySelectorAll(".nonexistent"),
        callback: vi.fn(),
      })

      expect(results).toHaveLength(0)
      expect(manager.registeredElements.size).toBe(0)
    })

    it("calls the shared callback with the state of the element that was hit", async () => {
      const manager = ForesightManager.initialize()
      const nodeList = createNodeList(2)
      const callback = vi.fn<ForesightCallback>()
      const [first] = manager.register({ element: nodeList, callback })

      await hover(nodeList[0]!)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback.mock.calls[0]?.[0].id).toBe(first?.id)
    })

    it("unregisters every element", () => {
      const manager = ForesightManager.initialize()
      const nodeList = createNodeList(3)
      const listener = vi.fn()
      manager.register({ element: nodeList, callback: vi.fn() })
      manager.addEventListener("elementUnregistered", listener)

      manager.unregister(nodeList)

      expect(manager.registeredElements.size).toBe(0)
      expect(listener).toHaveBeenCalledTimes(3)
    })

    it("reactivates every element", async () => {
      const manager = ForesightManager.initialize()
      const nodeList = createNodeList(2)
      manager.register({ element: nodeList, callback: vi.fn() })
      for (const element of nodeList) {
        await hover(element)
      }
      await settle()
      expect(countElements(manager, "isActive")).toBe(0)

      manager.reactivate(nodeList)

      expect(countElements(manager, "isActive")).toBe(2)
    })
  })

  describe("State channel (subscribe / getSnapshot / subscribeToElement)", () => {
    it("returns the current state from getSnapshot", () => {
      const { result } = setup({ name: "snap-test" })

      expect(result.getSnapshot()).toMatchObject({
        name: "snap-test",
        isRegistered: true,
        isActive: true,
        isPredicted: false,
      })
    })

    it("notifies subscribers until they unsubscribe", async () => {
      const { manager, element, result } = setup()
      const viaResult = vi.fn()
      const viaManager = vi.fn()
      const unsubscribeResult = result.subscribe(viaResult)
      const unsubscribeManager = manager.subscribeToElement(element, viaManager)

      await hover(element)
      expect(viaResult).toHaveBeenCalled()
      expect(viaManager).toHaveBeenCalled()

      unsubscribeResult()
      unsubscribeManager?.()
      viaResult.mockClear()
      viaManager.mockClear()
      await settle()
      manager.reactivate(element)

      expect(viaResult).not.toHaveBeenCalled()
      expect(viaManager).not.toHaveBeenCalled()
    })

    it("lets listeners read the new state", async () => {
      const { manager, element } = setup()
      let captured: ForesightElementState | undefined
      manager.subscribeToElement(element, () => {
        captured = manager.registeredElements.get(element)
      })

      await hover(element)

      expect(captured?.isPredicted).toBe(true)
    })

    it("reflects changes made while unsubscribed", async () => {
      const { element, result } = setup()
      result.subscribe(vi.fn())()

      await hover(element)
      await settle()

      expect(result.getSnapshot()).toMatchObject({ isActive: false, status: "success" })
    })

    it("shares state between results of re-registrations", () => {
      const { manager, element, result } = setup()

      const next = manager.register({ element, callback: vi.fn() })

      expect(next.getSnapshot()).toBe(result.getSnapshot())
    })

    it("returns undefined from subscribeToElement for unregistered elements", () => {
      const { manager, element } = setup()

      manager.unregister(element)

      expect(manager.subscribeToElement(element, vi.fn())).toBeUndefined()
    })
  })

  describe("Bounds channel (getBounds / subscribeToBounds)", () => {
    it("notifies only bounds subscribers on a rect-only update", async () => {
      const { element, result } = setup()
      await settle()
      const stateListener = vi.fn()
      const boundsListener = vi.fn()
      result.subscribe(stateListener)
      result.subscribeToBounds(boundsListener)
      const snapshotBefore = result.getSnapshot()

      reportPosition(element, rectAt(300, 300))

      expect(boundsListener).toHaveBeenCalledTimes(1)
      expect(stateListener).not.toHaveBeenCalled()
      expect(result.getSnapshot()).toBe(snapshotBefore)
      expect(result.getBounds().originalRect.top).toBe(300)
    })

    it("notifies only state subscribers on a logical change", async () => {
      const { element, result } = setup()
      await settle()
      const stateListener = vi.fn()
      const boundsListener = vi.fn()
      result.subscribe(stateListener)
      result.subscribeToBounds(boundsListener)
      const boundsBefore = result.getBounds()

      await hover(element)
      await settle()

      expect(stateListener).toHaveBeenCalled()
      expect(boundsListener).not.toHaveBeenCalled()
      expect(result.getBounds()).toBe(boundsBefore)
    })

    it("does not notify when the rect is unchanged", async () => {
      const { element, result } = setup()
      await settle()
      const boundsListener = vi.fn()
      result.subscribeToBounds(boundsListener)
      const boundsBefore = result.getBounds()

      reportPosition(element, rectAt())

      expect(boundsListener).not.toHaveBeenCalled()
      expect(result.getBounds()).toBe(boundsBefore)
    })

    it("defers measuring until after the registering task", async () => {
      const manager = ForesightManager.initialize()
      const elements = [createElement(), createElement()]
      const reads = elements.map(element => vi.spyOn(element, "getBoundingClientRect"))
      const results = elements.map(element => manager.register({ element, callback: vi.fn() }))

      expect(reads.every(read => read.mock.calls.length === 0)).toBe(true)
      expect(results[0].getSnapshot().isIntersectingWithViewport).toBe(false)

      await Promise.resolve()

      expect(reads.every(read => read.mock.calls.length === 1)).toBe(true)
      expect(results[0].getSnapshot().isIntersectingWithViewport).toBe(true)
      expect(results[0].getBounds().originalRect.top).toBe(100)
    })

    it("updates bounds before state on a hitSlop change", () => {
      const { manager, element, result } = setup({ hitSlop: 10 })
      const order: string[] = []
      let expandedTop: number | undefined
      result.subscribeToBounds(() => order.push("bounds"))
      result.subscribe(() => {
        order.push("state")
        expandedTop = result.getBounds().expandedRect.top
      })

      manager.updateElementOptions(element, { hitSlop: 50 })

      expect(order).toEqual(["bounds", "state"])
      expect(expandedTop).toBe(50)
    })

    it("supports manager-level bounds subscriptions and clears them on unregister", async () => {
      const { manager, element } = setup()
      await settle()
      const boundsListener = vi.fn()
      manager.subscribeToElementBounds(element, boundsListener)

      reportPosition(element, rectAt(300, 300))
      expect(boundsListener).toHaveBeenCalledTimes(1)
      expect(manager.getElementBounds(element)?.originalRect.top).toBe(300)

      manager.unregister(element)
      expect(boundsListener).toHaveBeenCalledTimes(1)
      expect(manager.subscribeToElementBounds(element, vi.fn())).toBeUndefined()
      expect(manager.getElementBounds(element)).toBeUndefined()
    })

    it("binds results of re-registrations to the same bounds", async () => {
      const { manager, element, result: first } = setup()
      const second = manager.register({ element, callback: vi.fn() })
      await settle()
      const boundsListener = vi.fn()
      first.subscribeToBounds(boundsListener)

      reportPosition(element, rectAt(300, 300))

      expect(boundsListener).toHaveBeenCalledTimes(1)
      expect(second.getBounds()).toBe(first.getBounds())
    })
  })

  describe("updateElementOptions", () => {
    it("updates name, meta and reactivateAfter and notifies subscribers", () => {
      const { manager, element, result, state } = setup({
        name: "old",
        meta: { route: "/a" },
        reactivateAfter: 5000,
      })
      const listener = vi.fn()
      result.subscribe(listener)

      manager.updateElementOptions(element, {
        name: "new",
        meta: { route: "/b" },
        reactivateAfter: 1000,
      })

      expect(state()).toMatchObject({ name: "new", meta: { route: "/b" }, reactivateAfter: 1000 })
      expect(listener).toHaveBeenCalled()
    })

    it("keeps omitted options", () => {
      const { manager, element, state } = setup({
        name: "my-name",
        reactivateAfter: 3000,
        meta: { x: 1 },
        enabled: false,
      })

      manager.updateElementOptions(element, {})

      expect(state()).toMatchObject({
        name: "my-name",
        reactivateAfter: 3000,
        meta: { x: 1 },
        isEnabled: false,
      })
    })

    it("swaps the callback", async () => {
      const { manager, element, callback } = setup()
      const next = vi.fn()

      manager.updateElementOptions(element, { callback: next })
      await hover(element)

      expect(callback).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledTimes(1)
    })

    it.each([
      [50, { top: 50, left: 50, right: 250, bottom: 250 }],
      [
        { top: 0, left: 20, right: 30, bottom: 40 },
        { top: 100, left: 80, right: 230, bottom: 240 },
      ],
    ])("updates hitSlop %o and recomputes expanded bounds", (hitSlop, expandedRect) => {
      const { manager, element } = setup({ hitSlop: 10 })

      manager.updateElementOptions(element, { hitSlop })

      expect(manager.getElementBounds(element)?.expandedRect).toEqual(expandedRect)
    })

    it("keeps references and stays quiet when hitSlop is content-equal", () => {
      const { manager, element, result, state } = setup({ hitSlop: 10 })
      const listener = vi.fn()
      const boundsListener = vi.fn()
      result.subscribe(listener)
      result.subscribeToBounds(boundsListener)
      const hitSlopBefore = state().hitSlop
      const boundsBefore = result.getBounds()

      manager.updateElementOptions(element, {
        hitSlop: { top: 10, left: 10, right: 10, bottom: 10 },
      })

      expect(state().hitSlop).toBe(hitSlopBefore)
      expect(result.getBounds()).toBe(boundsBefore)
      expect(listener).not.toHaveBeenCalled()
      expect(boundsListener).not.toHaveBeenCalled()
    })

    it("reschedules a pending reactivation when reactivateAfter changes", async () => {
      const { manager, element, state } = setup({ reactivateAfter: 5000 })
      await hover(element)
      await settle()

      manager.updateElementOptions(element, { reactivateAfter: 500 })
      await vi.advanceTimersByTimeAsync(500)

      expect(state().isActive).toBe(true)
    })

    it("cancels a pending reactivation when updated to Infinity", async () => {
      const { manager, element, state } = setup({ reactivateAfter: 2000 })
      await hover(element)
      await settle()

      manager.updateElementOptions(element, { reactivateAfter: Infinity })
      await vi.advanceTimersByTimeAsync(10_000)

      expect(state().isActive).toBe(false)
    })

    it("does not deactivate an element that has not fired", async () => {
      const { manager, element, state } = setup({ reactivateAfter: 5000 })

      manager.updateElementOptions(element, { reactivateAfter: 100 })
      await vi.advanceTimersByTimeAsync(200)

      expect(state().isActive).toBe(true)
    })

    it("schedules reactivation when updated from Infinity while predicted", async () => {
      const { manager, element, state } = setup()
      await hover(element)
      await settle()

      manager.updateElementOptions(element, { reactivateAfter: 1000 })
      await vi.advanceTimersByTimeAsync(1000)

      expectState(state(), { isPredicted: false, isCallbackRunning: false, isActive: true })
    })

    it("keeps a pending reactivation when reactivateAfter is unchanged", async () => {
      const { manager, element, state } = setup({ reactivateAfter: 2000 })
      await hover(element)
      await settle()

      manager.updateElementOptions(element, { name: "updated-name" })
      await vi.advanceTimersByTimeAsync(2000)

      expectState(state(), { isPredicted: false, isCallbackRunning: false, isActive: true })
    })

    it("throws when the element is not registered", () => {
      const manager = ForesightManager.initialize()

      expect(() => manager.updateElementOptions(createElement(), { name: "test" })).toThrow(
        "Cannot update options: element is not registered."
      )
    })
  })

  describe("replaceElementOptions", () => {
    it("resets omitted options to their registration defaults", () => {
      const { manager, element } = setup({
        name: "custom",
        meta: { a: 1 },
        hitSlop: 50,
        reactivateAfter: 1000,
        enabled: false,
      })

      const state = manager.replaceElementOptions(element, { callback: vi.fn() })

      expect(state).toMatchObject({
        name: "test-element",
        meta: {},
        hitSlop: manager.getManagerData.globalSettings.defaultHitSlop,
        reactivateAfter: Infinity,
        isEnabled: true,
        isActive: true,
      })
    })
  })

  describe("enabled option", () => {
    it("registers disabled elements as inactive and never fires them", async () => {
      const { manager, element, callback, state } = setup({ enabled: false })

      expect(manager.registeredElements.has(element)).toBe(true)
      expect(state()).toMatchObject({ isRegistered: true, isEnabled: false, isActive: false })

      await hover(element)
      expect(callback).not.toHaveBeenCalled()
    })

    it("toggles activity without re-registering", () => {
      const { manager, element, state } = setup({ enabled: false })

      manager.updateElementOptions(element, { enabled: true })
      expect(state()).toMatchObject({ isEnabled: true, isActive: true })

      manager.updateElementOptions(element, { enabled: false })
      expect(state()).toMatchObject({ isRegistered: true, isEnabled: false, isActive: false })
    })

    it("tears down global listeners when the last active element is disabled", async () => {
      const { manager, element } = setup()
      expect(await isListening(manager)).toBe(true)

      manager.updateElementOptions(element, { enabled: false })

      expect(await isListening(manager)).toBe(false)
    })

    it("re-arms global listeners when re-enabled after firing left the manager idle", async () => {
      const { manager, element, state } = setup()
      await hover(element)
      await settle()
      expect(await isListening(manager)).toBe(false)

      manager.updateElementOptions(element, { enabled: false })
      manager.updateElementOptions(element, { enabled: true })

      expect(await isListening(manager)).toBe(true)
      expect(state().isActive).toBe(true)
    })
  })

  describe("limited connection / data saver", () => {
    beforeEach(() => device.hasConnectionLimitations.mockReturnValue(true))
    afterEach(() => device.hasConnectionLimitations.mockReturnValue(false))

    it("registers the element but keeps it inactive and never fires it", async () => {
      const { manager, element, callback, result } = setup()

      expect(result).toMatchObject({
        isRegistered: true,
        isLimitedConnection: true,
        isEnabled: true,
        isActive: false,
      })
      expect(countElements(manager, "isActive")).toBe(0)

      await hover(element)
      expect(callback).not.toHaveBeenCalled()
    })

    it("stays inactive when enabled or reactivated", () => {
      const { manager, element, state } = setup({ enabled: false })

      manager.updateElementOptions(element, { enabled: true, name: "renamed" })
      manager.reactivate(element)

      expect(state()).toMatchObject({ name: "renamed", isEnabled: true, isActive: false })
      expect(countElements(manager, "isActive")).toBe(0)
    })
  })

  describe("DOM disconnect / reconnect (KeepAlive, Teleport, re-parenting)", () => {
    const detach = async (element: Element) => {
      element.remove()
      await settle()
    }

    const reattach = async (element: Element) => {
      document.body.appendChild(element)
      await settle()
    }

    it("parks a detached element without unregistering it, and resumes it on reconnect", async () => {
      const { manager, element, callback, state } = setup()
      const onUnregister = vi.fn()
      manager.addEventListener("elementUnregistered", onUnregister)

      await detach(element)
      expect(state()).toMatchObject({ isRegistered: true, isActive: false, isParked: true })
      expect(countElements(manager, "isParked")).toBe(1)
      expect(onUnregister).not.toHaveBeenCalled()
      expect(await isListening(manager)).toBe(true)

      await reattach(element)
      expect(state()).toMatchObject({ isRegistered: true, isActive: true, isParked: false })
      expect(countElements(manager, "isParked")).toBe(0)

      await hover(element)
      expect(callback).toHaveBeenCalled()
    })

    it("can be unregistered while parked", async () => {
      const { manager, element, result } = setup()
      await detach(element)

      result.unregister()

      expect(manager.registeredElements.has(element)).toBe(false)
      expect(countElements(manager, "isParked")).toBe(0)
    })

    it("does not reactivate an element parked mid-callback, and restarts the cooldown on reconnect", async () => {
      const { callback, resolve } = deferredCallback()
      const { element, state } = setup({ callback, reactivateAfter: 1000 })

      await hover(element)
      await detach(element)
      resolve()
      await vi.advanceTimersByTimeAsync(1000)
      expect(state()).toMatchObject({ isParked: true, isActive: false })

      await reattach(element)
      await vi.advanceTimersByTimeAsync(600)
      expect(state().isActive).toBe(false)

      await vi.advanceTimersByTimeAsync(400)
      expect(state()).toMatchObject({ isParked: false, isActive: true })
    })

    it("stays inactive on reconnect when disabled", async () => {
      const { element, state } = setup({ enabled: false })

      await detach(element)
      await reattach(element)

      expect(state()).toMatchObject({ isEnabled: false, isActive: false })
    })

    it("does not reactivate a fired element on reconnect", async () => {
      const { element, state } = setup()
      await hover(element)
      await settle()

      await detach(element)
      await reattach(element)

      expect(state()).toMatchObject({ isActive: false, isPredicted: true })
    })

    it("resumes the reactivation cooldown of a fired element on reconnect", async () => {
      const { element, state } = setup({ reactivateAfter: 5000 })
      await hover(element)
      await settle()

      await detach(element)
      await reattach(element)
      expect(state().isActive).toBe(false)

      await vi.advanceTimersByTimeAsync(5000)
      expect(state()).toMatchObject({ isActive: true, isPredicted: false })
    })
  })
})
