import { defineComponent, h, ref, withDirectives } from "vue"
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUnregisteredSnapshot } from "js.foresight"
import { mockState, registerSpy, unregisterSpy } from "../tests/setup"
import { vForesight } from "./vForesight"

beforeEach(() => {
  registerSpy.mockClear()
  unregisterSpy.mockClear()
  mockState.listeners = []
  mockState.lastCallbackWrapper = null
  mockState.currentSnapshot = createUnregisteredSnapshot(false)
})

describe("vForesight directive", () => {
  it("registers the element on mount", () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        return { callback: cb }
      },
      render() {
        return withDirectives(h("button", { "data-testid": "el" }), [
          [vForesight, { name: "test-btn", callback: this.callback }],
        ])
      },
    })

    mount(Component, { attachTo: document.body })

    expect(registerSpy).toHaveBeenCalledTimes(1)
    const arg = registerSpy.mock.calls[0][0]
    expect(arg.element).toBeInstanceOf(HTMLButtonElement)
    expect(arg.name).toBe("test-btn")
  })

  it("unregisters the element on unmount", () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        return { callback: cb }
      },
      render() {
        return withDirectives(h("button", { "data-testid": "el" }), [
          [vForesight, { name: "btn", callback: this.callback }],
        ])
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    wrapper.unmount()

    expect(unregisterSpy).toHaveBeenCalledTimes(1)
  })

  it("patches registration on update without unregistering", async () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        const name = ref("first")

        return { callback: cb, name }
      },
      render() {
        return withDirectives(h("button", { "data-testid": "el" }), [
          [vForesight, { name: this.name, callback: this.callback }],
        ])
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    registerSpy.mockClear()

    wrapper.vm.name = "second"
    await wrapper.vm.$nextTick()

    expect(registerSpy).toHaveBeenCalled()
    const lastCall = registerSpy.mock.calls[registerSpy.mock.calls.length - 1]
    expect(lastCall?.[0].name).toBe("second")
    expect(unregisterSpy).not.toHaveBeenCalled()
  })

  it("forwards the callback from the binding value", () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        return { callback: cb }
      },
      render() {
        return withDirectives(h("button"), [
          [vForesight, { name: "btn", callback: this.callback }],
        ])
      },
    })

    mount(Component, { attachTo: document.body })

    const fired = { ...createUnregisteredSnapshot(false), isPredicted: true }
    mockState.lastCallbackWrapper?.(fired)

    expect(cb).toHaveBeenCalledWith(fired)
  })

  it("accepts a plain function as shorthand", () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        return { callback: cb }
      },
      render() {
        return withDirectives(h("button", { "data-testid": "el" }), [[vForesight, this.callback]])
      },
    })

    mount(Component, { attachTo: document.body })

    expect(registerSpy).toHaveBeenCalledTimes(1)

    const fired = { ...createUnregisteredSnapshot(false), isPredicted: true }
    mockState.lastCallbackWrapper?.(fired)

    expect(cb).toHaveBeenCalled()
  })
})
