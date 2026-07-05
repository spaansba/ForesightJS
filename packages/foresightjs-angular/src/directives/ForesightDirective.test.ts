import { ElementRef, NgZone } from "@angular/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUnregisteredSnapshot, type ForesightCallback } from "js.foresight"
import { ForesightService } from "../services/ForesightService"
import { mockState, registerSpy, updateElementOptionsSpy, unregisterSpy } from "../tests/setup"
import { ForesightDirective } from "./ForesightDirective"

const zone = {
  run: <T>(fn: () => T): T => fn(),
} as NgZone

const createDirective = (element: HTMLElement | SVGElement = document.createElement("button")) =>
  new ForesightDirective(new ElementRef(element), new ForesightService(zone))

beforeEach(() => {
  registerSpy.mockClear()
  updateElementOptionsSpy.mockClear()
  unregisterSpy.mockClear()
  mockState.listeners = []
  mockState.lastCallbackWrapper = null
  mockState.currentSnapshot = createUnregisteredSnapshot(false)
})

describe("ForesightDirective", () => {
  it("registers the host element on change", () => {
    const callback = vi.fn()
    const directive = createDirective()
    directive.fsForesight = callback
    directive.fsForesightName = "checkout"

    directive.ngOnChanges()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(HTMLButtonElement)
    expect(registerSpy.mock.calls[0][0].name).toBe("checkout")
  })

  it("accepts a full options object", () => {
    const callback = vi.fn()
    const directive = createDirective()
    directive.fsForesight = { callback, name: "options-name", hitSlop: 20, enabled: false }

    directive.ngOnChanges()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy.mock.calls[0][0].name).toBe("options-name")
    expect(registerSpy.mock.calls[0][0].hitSlop).toBe(20)
    expect(registerSpy.mock.calls[0][0].enabled).toBe(false)
  })

  it("lets individual directive inputs override the options object", () => {
    const callback = vi.fn()
    const directive = createDirective()
    directive.fsForesight = { callback, name: "base", hitSlop: 20, enabled: true }
    directive.fsForesightName = "override"
    directive.fsForesightEnabled = false

    directive.ngOnChanges()

    expect(registerSpy.mock.calls[0][0].name).toBe("override")
    expect(registerSpy.mock.calls[0][0].enabled).toBe(false)
  })

  it("unregisters on destroy", () => {
    const directive = createDirective()
    directive.fsForesight = vi.fn<ForesightCallback>()
    directive.ngOnChanges()

    directive.ngOnDestroy()

    expect(unregisterSpy).toHaveBeenCalledTimes(1)
  })

  it("patches options on the same element without unregistering", () => {
    const directive = createDirective()
    directive.fsForesight = { callback: vi.fn(), name: "first" }
    directive.ngOnChanges()

    directive.fsForesight = { callback: vi.fn(), name: "second" }
    directive.ngOnChanges()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(unregisterSpy).not.toHaveBeenCalled()
    expect(updateElementOptionsSpy.mock.calls.at(-1)?.[1].name).toBe("second")
  })

  it("forwards the latest callback after an options patch", () => {
    const first = vi.fn()
    const second = vi.fn()
    const directive = createDirective()
    directive.fsForesight = { callback: first, name: "callback" }
    directive.ngOnChanges()

    directive.fsForesight = { callback: second, name: "callback" }
    directive.ngOnChanges()

    const fired = { ...createUnregisteredSnapshot(false), isPredicted: true }
    mockState.lastCallbackWrapper?.(fired)

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith(fired)
  })

  it("exposes state as an Angular signal", () => {
    const directive = createDirective()
    directive.fsForesight = vi.fn<ForesightCallback>()
    directive.ngOnChanges()

    expect(directive.state().isPredicted).toBe(false)

    mockState.currentSnapshot = { ...createUnregisteredSnapshot(false), isPredicted: true }
    mockState.listeners.forEach(listener => listener())

    expect(directive.state().isPredicted).toBe(true)
  })

  it("registers SVG elements", () => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    const directive = createDirective(circle)
    directive.fsForesight = vi.fn<ForesightCallback>()
    directive.fsForesightName = "circle"

    directive.ngOnChanges()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(SVGElement)
    expect(registerSpy.mock.calls[0][0].name).toBe("circle")
  })

  it("unregisters when the directive value is cleared", () => {
    const directive = createDirective()
    directive.fsForesight = vi.fn<ForesightCallback>()
    directive.ngOnChanges()

    directive.fsForesight = null
    directive.ngOnChanges()

    expect(unregisterSpy).toHaveBeenCalledTimes(1)
    expect(directive.state().isRegistered).toBe(false)
  })
})
