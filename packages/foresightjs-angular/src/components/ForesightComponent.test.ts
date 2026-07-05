import { ElementRef, NgZone } from "@angular/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUnregisteredSnapshot } from "js.foresight"
import { ForesightService } from "../services/ForesightService"
import { mockState, registerSpy, updateElementOptionsSpy, unregisterSpy } from "../tests/setup"
import { ForesightComponent } from "./ForesightComponent"

const zone = {
  run: <T>(fn: () => T): T => fn(),
} as NgZone

const createComponent = () =>
  new ForesightComponent(new ElementRef(document.createElement("foresight")), new ForesightService(zone))

beforeEach(() => {
  registerSpy.mockClear()
  updateElementOptionsSpy.mockClear()
  unregisterSpy.mockClear()
  mockState.listeners = []
  mockState.lastCallbackWrapper = null
  mockState.currentSnapshot = createUnregisteredSnapshot(false)
})

describe("ForesightComponent", () => {
  it("registers the host element with mapped inputs", () => {
    const component = createComponent()
    component.callback = vi.fn()
    component.foresightName = "checkout"
    component.hitSlop = 40

    component.ngOnChanges()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy.mock.calls[0][0].name).toBe("checkout")
    expect(registerSpy.mock.calls[0][0].hitSlop).toBe(40)
  })

  it("patches options on input changes without re-registering", () => {
    const component = createComponent()
    component.callback = vi.fn()
    component.foresightName = "first"
    component.ngOnChanges()

    component.foresightName = "second"
    component.ngOnChanges()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(unregisterSpy).not.toHaveBeenCalled()
    expect(updateElementOptionsSpy.mock.calls.at(-1)?.[1].name).toBe("second")
  })

  it("exposes state as an Angular signal and unregisters on destroy", () => {
    const component = createComponent()
    component.callback = vi.fn()
    component.ngOnChanges()

    mockState.currentSnapshot = { ...createUnregisteredSnapshot(false), isPredicted: true }
    mockState.listeners.forEach(listener => listener())
    expect(component.state().isPredicted).toBe(true)

    component.ngOnDestroy()

    expect(unregisterSpy).toHaveBeenCalledTimes(1)
    expect(component.state().isPredicted).toBe(false)
  })
})
