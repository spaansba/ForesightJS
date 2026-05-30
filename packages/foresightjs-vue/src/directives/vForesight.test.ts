import { defineComponent, h, ref, withDirectives } from "vue"
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUnregisteredSnapshot } from "js.foresight"
import { mockState, registerSpy, updateElementOptionsSpy, unregisterSpy } from "../tests/setup"
import { vForesight } from "./vForesight"

beforeEach(() => {
  registerSpy.mockClear()
  updateElementOptionsSpy.mockClear()
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

    expect(updateElementOptionsSpy).toHaveBeenCalled()
    const lastCall =
      updateElementOptionsSpy.mock.calls[updateElementOptionsSpy.mock.calls.length - 1]
    expect(lastCall?.[1].name).toBe("second")
    expect(unregisterSpy).not.toHaveBeenCalled()
  })

  it("forwards the callback from the binding value", () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        return { callback: cb }
      },
      render() {
        return withDirectives(h("button"), [[vForesight, { name: "btn", callback: this.callback }]])
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

  it("registers SVG elements", () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        return { callback: cb }
      },
      render() {
        return h("svg", {}, [
          withDirectives(h("circle", { cx: 50, cy: 50, r: 40 }), [
            [vForesight, { name: "svg-circle", callback: this.callback }],
          ]),
        ])
      },
    })

    mount(Component, { attachTo: document.body })

    expect(registerSpy).toHaveBeenCalledTimes(1)
    const arg = registerSpy.mock.calls[0][0]
    expect(arg.element).toBeInstanceOf(SVGElement)
    expect(arg.name).toBe("svg-circle")
  })

  it("skips updateElementOptions when binding value has not changed", async () => {
    const options = { name: "stable", callback: vi.fn() }
    const Component = defineComponent({
      setup() {
        const counter = ref(0)

        return { options, counter }
      },
      render() {
        // counter in template forces re-render but directive value is same reference
        return withDirectives(h("button", {}, `count: ${this.counter}`), [
          [vForesight, this.options],
        ])
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    updateElementOptionsSpy.mockClear()

    // Trigger a re-render without changing the directive value
    wrapper.vm.counter = 1
    await wrapper.vm.$nextTick()

    expect(updateElementOptionsSpy).not.toHaveBeenCalled()
  })

  describe("enabled option", () => {
    it("does not register when enabled is false", () => {
      const Component = defineComponent({
        setup() {
          return { callback: vi.fn() }
        },
        render() {
          return withDirectives(h("button", { "data-testid": "el" }), [
            [vForesight, { name: "disabled-btn", callback: this.callback, enabled: false }],
          ])
        },
      })

      mount(Component, { attachTo: document.body })

      expect(registerSpy).not.toHaveBeenCalled()
    })

    it("registers when enabled toggles from false to true", async () => {
      const Component = defineComponent({
        setup() {
          const enabled = ref(false)

          return { callback: vi.fn(), enabled }
        },
        render() {
          return withDirectives(h("button", { "data-testid": "el" }), [
            [vForesight, { name: "toggle-btn", callback: this.callback, enabled: this.enabled }],
          ])
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      expect(registerSpy).not.toHaveBeenCalled()

      wrapper.vm.enabled = true
      await wrapper.vm.$nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].name).toBe("toggle-btn")
    })

    it("unregisters when enabled toggles from true to false", async () => {
      const Component = defineComponent({
        setup() {
          const enabled = ref(true)

          return { callback: vi.fn(), enabled }
        },
        render() {
          return withDirectives(h("button", { "data-testid": "el" }), [
            [vForesight, { name: "toggle-btn", callback: this.callback, enabled: this.enabled }],
          ])
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      expect(registerSpy).toHaveBeenCalledTimes(1)

      wrapper.vm.enabled = false
      await wrapper.vm.$nextTick()

      expect(unregisterSpy).toHaveBeenCalledTimes(1)
      expect(updateElementOptionsSpy).not.toHaveBeenCalled()
    })

    it("does not patch options while disabled", async () => {
      const Component = defineComponent({
        setup() {
          const name = ref("first")

          return { callback: vi.fn(), name }
        },
        render() {
          return withDirectives(h("button", { "data-testid": "el" }), [
            [vForesight, { name: this.name, callback: this.callback, enabled: false }],
          ])
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })

      wrapper.vm.name = "second"
      await wrapper.vm.$nextTick()

      expect(registerSpy).not.toHaveBeenCalled()
      expect(updateElementOptionsSpy).not.toHaveBeenCalled()
    })
  })

  it("calls updateElementOptions when binding value changes reference", async () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        const opts = ref<{ name: string; callback: () => void }>({ name: "first", callback: cb })

        return { opts }
      },
      render() {
        return withDirectives(h("button"), [[vForesight, this.opts]])
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    updateElementOptionsSpy.mockClear()

    // Assign a new object (different reference)
    wrapper.vm.opts = { name: "second", callback: cb }
    await wrapper.vm.$nextTick()

    expect(updateElementOptionsSpy).toHaveBeenCalledTimes(1)
    const lastCall =
      updateElementOptionsSpy.mock.calls[updateElementOptionsSpy.mock.calls.length - 1]
    expect(lastCall?.[1].name).toBe("second")
  })
})
