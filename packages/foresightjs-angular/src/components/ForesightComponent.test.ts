import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUnregisteredSnapshot } from "js.foresight"
import { createInContext } from "../tests/helpers"
import { mockState, registerSpy, replaceElementOptionsSpy, unregisterSpy } from "../tests/setup"
import { ForesightComponent } from "./ForesightComponent"

const createComponent = () =>
  createInContext(() => new ForesightComponent(), {
    element: document.createElement("foresight"),
  })

beforeEach(() => {
  registerSpy.mockClear()
  replaceElementOptionsSpy.mockClear()
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
    expect(replaceElementOptionsSpy.mock.calls.at(-1)?.[1].name).toBe("second")
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
