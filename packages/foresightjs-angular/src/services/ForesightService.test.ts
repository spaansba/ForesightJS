import type { NgZone } from "@angular/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUnregisteredSnapshot } from "js.foresight"
import { addEventListenerSpy, mockState, registerSpy, unregisterSpy } from "../tests/setup"
import { ForesightService } from "./ForesightService"

const zone = {
  run: <T>(fn: () => T): T => fn(),
} as NgZone

const createService = () => new ForesightService(zone)
const createServiceWithZone = (testZone: Pick<NgZone, "run">) =>
  new ForesightService(testZone as NgZone)

beforeEach(() => {
  addEventListenerSpy.mockClear()
  registerSpy.mockClear()
  unregisterSpy.mockClear()
  mockState.listeners = []
  mockState.lastCallbackWrapper = null
  mockState.currentSnapshot = createUnregisteredSnapshot(false)
})

describe("ForesightService", () => {
  it("registers and unregisters an element", () => {
    const service = createService()
    const element = document.createElement("button")
    const registration = service.register(element, { callback: vi.fn(), name: "service" })

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy.mock.calls[0][0].element).toBe(element)
    expect(registration.state().isRegistered).toBe(false)

    registration.unregister()

    expect(unregisterSpy).toHaveBeenCalledTimes(1)
  })

  it("updates the state signal when the manager publishes a new snapshot", () => {
    const service = createService()
    const registration = service.register(document.createElement("button"), { callback: vi.fn() })

    mockState.currentSnapshot = { ...createUnregisteredSnapshot(false), isPredicted: true }
    mockState.listeners.forEach(listener => listener())

    expect(registration.state().isPredicted).toBe(true)
  })

  it("runs user callbacks inside the Angular zone", () => {
    const run = vi.fn(<T>(fn: () => T): T => fn())
    const service = createServiceWithZone({ run })
    const callback = vi.fn()
    service.register(document.createElement("button"), { callback })

    run.mockClear()
    const fired = { ...createUnregisteredSnapshot(false), isPredicted: true }
    mockState.lastCallbackWrapper?.(fired)

    expect(run).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(fired)
  })

  it("runs state resets inside the Angular zone", () => {
    const run = vi.fn(<T>(fn: () => T): T => fn())
    const service = createServiceWithZone({ run })
    const registration = service.register(document.createElement("button"), { callback: vi.fn() })

    run.mockClear()
    registration.unregister()

    expect(run).toHaveBeenCalledTimes(1)
    expect(registration.state().isRegistered).toBe(false)
  })

  it("subscribes to manager events and aborts on unsubscribe", () => {
    const service = createService()
    const listener = vi.fn()
    const unsubscribe = service.listen("callbackCompleted", listener)

    expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
    expect(addEventListenerSpy).toHaveBeenCalledWith("callbackCompleted", expect.any(Function), {
      signal: expect.any(AbortSignal),
    })

    const signal = addEventListenerSpy.mock.calls[0][2]?.signal as AbortSignal
    expect(signal.aborted).toBe(false)

    unsubscribe()

    expect(signal.aborted).toBe(true)
  })

  it("forwards manager events to the listener", () => {
    const service = createService()
    const listener = vi.fn()
    service.listen("callbackCompleted", listener)

    const registeredListener = addEventListenerSpy.mock.calls[0][1]
    const fakeEvent = { type: "callbackCompleted", timestamp: 1 }
    registeredListener(fakeEvent)

    expect(listener).toHaveBeenCalledWith(fakeEvent)
  })
})
