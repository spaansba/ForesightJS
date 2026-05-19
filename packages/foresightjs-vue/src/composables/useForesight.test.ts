import { defineComponent, h, nextTick, ref } from "vue"
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUnregisteredSnapshot, type ForesightCallback } from "js.foresight"
import { mockState, registerSpy, updateElementOptionsSpy, unregisterSpy } from "../tests/setup"
import { useForesight } from "./useForesight"

beforeEach(() => {
  registerSpy.mockClear()
  updateElementOptionsSpy.mockClear()
  unregisterSpy.mockClear()
  mockState.listeners = []
  mockState.lastCallbackWrapper = null
  mockState.currentSnapshot = null
})

describe("useForesight", () => {
  it("registers the element when setRef is bound via :ref", async () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        return useForesight({
          callback: cb,
          name: "test-btn",
        })
      },
      render() {
        return h("button", { ref: this.setRef, "data-testid": "el" })
      },
    })

    mount(Component, { attachTo: document.body })
    await nextTick()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    const arg = registerSpy.mock.calls[0][0]
    expect(arg.element).toBeInstanceOf(HTMLButtonElement)
    expect(arg.name).toBe("test-btn")
  })

  it("accepts a getter as options (reactive deps tracked)", async () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        return useForesight(() => ({
          callback: cb,
          name: "getter-opts",
        }))
      },
      render() {
        return h("button", { ref: this.setRef, "data-testid": "el" })
      },
    })

    mount(Component, { attachTo: document.body })
    await nextTick()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    const arg = registerSpy.mock.calls[0][0]
    expect(arg.name).toBe("getter-opts")
  })

  it("does not register when setRef is never called", async () => {
    const Component = defineComponent({
      setup() {
        return useForesight({ callback: vi.fn() })
      },
      render() {
        return h("span", "no ref here")
      },
    })

    mount(Component, { attachTo: document.body })
    await nextTick()

    expect(registerSpy).not.toHaveBeenCalled()
  })

  it("unregisters on unmount", async () => {
    const Component = defineComponent({
      setup() {
        return useForesight({ callback: vi.fn() })
      },
      render() {
        return h("button", { ref: this.setRef })
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    wrapper.unmount()
    expect(unregisterSpy).toHaveBeenCalledTimes(1)
  })

  it("unregisters when element is removed (setRef receives null)", async () => {
    const Component = defineComponent({
      setup() {
        const show = ref(true)
        const result = useForesight({ callback: vi.fn(), name: "removable" })

        return { ...result, show }
      },
      render() {
        return this.show
          ? h("button", { ref: this.setRef, "data-testid": "btn" })
          : h("span", "gone")
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()
    expect(registerSpy).toHaveBeenCalledTimes(1)

    wrapper.vm.show = false
    await nextTick()
    expect(unregisterSpy).toHaveBeenCalledTimes(1)
  })

  it("forwards the callback to the manager", async () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        return useForesight({ callback: cb })
      },
      render() {
        return h("button", { ref: this.setRef })
      },
    })

    mount(Component, { attachTo: document.body })
    await nextTick()

    const fired = { ...createUnregisteredSnapshot(false), isPredicted: true }
    mockState.lastCallbackWrapper?.(fired)

    expect(cb).toHaveBeenCalledWith(fired)
  })

  it("returns flat refs with unregistered initial state", () => {
    const Component = defineComponent({
      setup() {
        return useForesight({ callback: vi.fn() })
      },
      render() {
        return h("span", {
          "data-testid": "state",
          "data-registered": this.isRegistered,
        })
      },
    })

    const wrapper = mount(Component)
    expect(wrapper.get("[data-testid=state]").attributes("data-registered")).toBe("false")
  })

  it("reflects manager state updates pushed through subscribe", async () => {
    const Component = defineComponent({
      setup() {
        return useForesight({ callback: vi.fn() })
      },
      render() {
        return h("button", {
          ref: this.setRef,
          "data-testid": "el",
          "data-predicted": this.isPredicted,
        })
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    expect(wrapper.get("[data-testid=el]").attributes("data-predicted")).toBe("false")

    mockState.currentSnapshot = { ...createUnregisteredSnapshot(false), isPredicted: true }
    mockState.listeners.forEach(l => l())
    await nextTick()

    expect(wrapper.get("[data-testid=el]").attributes("data-predicted")).toBe("true")
  })

  it("forwards the latest callback (no stale closure)", async () => {
    const cb1 = vi.fn<ForesightCallback>()
    const cb2 = vi.fn<ForesightCallback>()

    const Component = defineComponent({
      setup() {
        const cb = ref<ForesightCallback>(cb1)
        const result = useForesight(() => ({
          name: "x",
          callback: cb.value,
        }))

        return { ...result, cb }
      },
      render() {
        return h("button", { ref: this.setRef, "data-testid": "el" })
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    wrapper.vm.cb = cb2
    await nextTick()
    await nextTick()

    const fired = { ...createUnregisteredSnapshot(false), isPredicted: true }
    mockState.lastCallbackWrapper?.(fired)

    expect(cb1).not.toHaveBeenCalled()
    expect(cb2).toHaveBeenCalledWith(fired)
  })

  it("patches options on the same element without unregistering", async () => {
    const Component = defineComponent({
      setup() {
        const name = ref("first")
        const result = useForesight(() => ({
          name: name.value,
          callback: vi.fn(),
        }))

        return { ...result, name }
      },
      render() {
        return h("button", { ref: this.setRef, "data-testid": "el" })
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()
    registerSpy.mockClear()

    wrapper.vm.name = "second"
    await nextTick()
    await nextTick()

    expect(updateElementOptionsSpy).toHaveBeenCalled()
    const lastCall =
      updateElementOptionsSpy.mock.calls[updateElementOptionsSpy.mock.calls.length - 1]
    expect(lastCall?.[1].name).toBe("second")
    expect(unregisterSpy).not.toHaveBeenCalled()
  })

  describe("element swaps via setRef", () => {
    it("re-registers when setRef receives a different element", async () => {
      const Component = defineComponent({
        setup() {
          const useSpan = ref(false)
          const result = useForesight({ callback: vi.fn(), name: "swap" })

          return { ...result, useSpan }
        },
        render() {
          return h("div", [
            this.useSpan
              ? h("span", { ref: this.setRef, "data-testid": "b" })
              : h("button", { ref: this.setRef, "data-testid": "a" }),
          ])
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(HTMLButtonElement)

      wrapper.vm.useSpan = true
      await nextTick()

      expect(unregisterSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy).toHaveBeenCalledTimes(2)
      expect(registerSpy.mock.calls[1][0].element).toBeInstanceOf(HTMLSpanElement)
    })
  })

  describe("enabled option", () => {
    it("does not register when enabled is false", async () => {
      const Component = defineComponent({
        setup() {
          return useForesight({
            callback: vi.fn(),
            name: "disabled-btn",
            enabled: false,
          })
        },
        render() {
          return h("button", { ref: this.setRef, "data-testid": "el" })
        },
      })

      mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).not.toHaveBeenCalled()
    })

    it("registers when enabled is true (explicit)", async () => {
      const Component = defineComponent({
        setup() {
          return useForesight({
            callback: vi.fn(),
            name: "enabled-btn",
            enabled: true,
          })
        },
        render() {
          return h("button", { ref: this.setRef, "data-testid": "el" })
        },
      })

      mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
    })

    it("registers when enabled is undefined (default)", async () => {
      const Component = defineComponent({
        setup() {
          return useForesight({
            callback: vi.fn(),
            name: "default-btn",
          })
        },
        render() {
          return h("button", { ref: this.setRef, "data-testid": "el" })
        },
      })

      mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
    })

    it("returns unregistered snapshot when disabled", async () => {
      const Component = defineComponent({
        setup() {
          return useForesight({
            callback: vi.fn(),
            enabled: false,
          })
        },
        render() {
          return h("button", {
            ref: this.setRef,
            "data-testid": "el",
            "data-registered": this.isRegistered,
          })
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()

      expect(wrapper.get("[data-testid=el]").attributes("data-registered")).toBe("false")
    })

    it("registers when enabled toggles from false to true", async () => {
      const Component = defineComponent({
        setup() {
          const enabled = ref(false)
          const result = useForesight(() => ({
            callback: vi.fn(),
            name: "toggle-btn",
            enabled: enabled.value,
          }))

          return { ...result, enabled }
        },
        render() {
          return h("button", { ref: this.setRef, "data-testid": "el" })
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()
      expect(registerSpy).not.toHaveBeenCalled()

      wrapper.vm.enabled = true
      await nextTick()
      await nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
    })

    it("unregisters when enabled toggles from true to false", async () => {
      const Component = defineComponent({
        setup() {
          const enabled = ref(true)
          const result = useForesight(() => ({
            callback: vi.fn(),
            name: "toggle-btn",
            enabled: enabled.value,
          }))

          return { ...result, enabled }
        },
        render() {
          return h("button", { ref: this.setRef, "data-testid": "el" })
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()
      expect(registerSpy).toHaveBeenCalledTimes(1)

      wrapper.vm.enabled = false
      await nextTick()
      await nextTick()

      expect(unregisterSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe("comment node filtering", () => {
    it("does not register when setRef receives a comment node component", async () => {
      const ChildComponent = defineComponent({
        props: { show: { type: Boolean, default: false } },
        render() {
          return this.show ? h("div", "visible") : null
        },
      })

      const Component = defineComponent({
        components: { ChildComponent },
        setup() {
          return useForesight({
            callback: vi.fn(),
            name: "comment",
          })
        },
        render() {
          return h(ChildComponent, { ref: this.setRef, show: false })
        },
      })

      mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).not.toHaveBeenCalled()
    })

    it("registers when setRef receives a real component element", async () => {
      const ChildComponent = defineComponent({
        render() {
          return h("div", { "data-testid": "child-el" }, "visible")
        },
      })

      const Component = defineComponent({
        components: { ChildComponent },
        setup() {
          return useForesight({
            callback: vi.fn(),
            name: "component-ref",
          })
        },
        render() {
          return h(ChildComponent, { ref: this.setRef })
        },
      })

      mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(HTMLDivElement)
    })

    it("registers when v-if transitions component from unmounted to mounted", async () => {
      const ChildComponent = defineComponent({
        render() {
          return h("div", { "data-testid": "child" }, "hello")
        },
      })

      const Component = defineComponent({
        components: { ChildComponent },
        setup() {
          const show = ref(false)
          const result = useForesight({
            callback: vi.fn(),
            name: "v-if-toggle",
          })

          return { ...result, show }
        },
        render() {
          return this.show ? h(ChildComponent, { ref: this.setRef }) : h("span", "placeholder")
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).not.toHaveBeenCalled()

      wrapper.vm.show = true
      await nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(HTMLDivElement)
    })
  })
})
