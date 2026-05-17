import {
  defineComponent,
  h,
  nextTick,
  ref,
  useTemplateRef,
  type ComponentPublicInstance,
  type Ref,
} from "vue"
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
  it("registers the element on mount using a useTemplateRef target", async () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        const btnRef = useTemplateRef<HTMLButtonElement>("myBtn")

        return useForesight(btnRef, {
          callback: cb,
          name: "test-btn",
        })
      },
      render() {
        return h("button", { ref: "myBtn", "data-testid": "el" })
      },
    })

    mount(Component, { attachTo: document.body })
    await nextTick()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    const arg = registerSpy.mock.calls[0][0]
    expect(arg.element).toBeInstanceOf(HTMLButtonElement)
    expect(arg.name).toBe("test-btn")
  })

  it("accepts a plain ref() as target", async () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        const el = ref<HTMLElement | null>(null)
        const result = useForesight(el, { callback: cb, name: "raw-ref" })

        return { ...result, el }
      },
      render() {
        return h("button", { ref: "el", "data-testid": "el" })
      },
    })

    mount(Component, { attachTo: document.body })
    await nextTick()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    const arg = registerSpy.mock.calls[0][0]
    expect(arg.name).toBe("raw-ref")
  })

  it("accepts a getter as options (reactive deps tracked)", async () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        const btnRef = useTemplateRef<HTMLButtonElement>("myBtn")

        return useForesight(btnRef, () => ({
          callback: cb,
          name: "getter-opts",
        }))
      },
      render() {
        return h("button", { ref: "myBtn", "data-testid": "el" })
      },
    })

    mount(Component, { attachTo: document.body })
    await nextTick()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    const arg = registerSpy.mock.calls[0][0]
    expect(arg.name).toBe("getter-opts")
  })

  it("does not register when target resolves to null", async () => {
    const Component = defineComponent({
      setup() {
        const el = ref<HTMLElement | null>(null)

        return useForesight(el, { callback: vi.fn() })
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
        const btnRef = useTemplateRef<HTMLButtonElement>("myBtn")

        return useForesight(btnRef, { callback: vi.fn() })
      },
      render() {
        return h("button", { ref: "myBtn" })
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    wrapper.unmount()
    expect(unregisterSpy).toHaveBeenCalledTimes(1)
  })

  it("registers when target transitions from null to element", async () => {
    const Component = defineComponent({
      setup() {
        const el = ref<HTMLElement | null>(null)
        const result = useForesight(el, { callback: vi.fn(), name: "delayed" })

        return { ...result, el }
      },
      render() {
        return h("div", [h("button", { "data-testid": "btn" })])
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    expect(registerSpy).not.toHaveBeenCalled()

    // Simulate target becoming available
    wrapper.vm.el = wrapper.find("[data-testid=btn]").element as HTMLElement
    await nextTick()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy.mock.calls[0][0].name).toBe("delayed")
  })

  it("unregisters when target transitions from element to null", async () => {
    const Component = defineComponent({
      setup() {
        const el = ref<HTMLElement | null>(null)
        const result = useForesight(el, { callback: vi.fn(), name: "removable" })

        return { ...result, el }
      },
      render() {
        return h("div", [h("button", { "data-testid": "btn" })])
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    // Assign element
    wrapper.vm.el = wrapper.find("[data-testid=btn]").element as HTMLElement
    await nextTick()
    expect(registerSpy).toHaveBeenCalledTimes(1)

    // Remove element
    wrapper.vm.el = null
    await nextTick()
    expect(unregisterSpy).toHaveBeenCalledTimes(1)
  })

  it("forwards the callback to the manager", async () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        const btnRef = useTemplateRef<HTMLButtonElement>("myBtn")

        return useForesight(btnRef, { callback: cb })
      },
      render() {
        return h("button", { ref: "myBtn" })
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
        const btnRef = useTemplateRef<HTMLButtonElement>("myBtn")
        const { isRegistered } = useForesight(btnRef, { callback: vi.fn() })

        return { isRegistered }
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
        const btnRef = useTemplateRef<HTMLButtonElement>("myBtn")
        const { isPredicted } = useForesight(btnRef, { callback: vi.fn() })

        return { isPredicted }
      },
      render() {
        return h("button", {
          ref: "myBtn",
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
        const btnRef = useTemplateRef<HTMLButtonElement>("myBtn")
        const cb = ref<ForesightCallback>(cb1)
        const result = useForesight(btnRef, () => ({
          name: "x",
          callback: cb.value,
        }))

        return { ...result, cb }
      },
      render() {
        return h("button", { ref: "myBtn", "data-testid": "el" })
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
        const btnRef = useTemplateRef<HTMLButtonElement>("myBtn")
        const name = ref("first")
        const result = useForesight(btnRef, () => ({
          name: name.value,
          callback: vi.fn(),
        }))

        return { ...result, name }
      },
      render() {
        return h("button", { ref: "myBtn", "data-testid": "el" })
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

  describe("string target (useTemplateRef shorthand)", () => {
    it("registers when passing a string ref name", async () => {
      const cb = vi.fn()
      const Component = defineComponent({
        setup() {
          return useForesight("myBtn", { callback: cb, name: "string-ref" })
        },
        render() {
          return h("button", { ref: "myBtn", "data-testid": "el" })
        },
      })

      mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
      const arg = registerSpy.mock.calls[0][0]
      expect(arg.element).toBeInstanceOf(HTMLButtonElement)
      expect(arg.name).toBe("string-ref")
    })

    it("does not register when string ref has no matching template element", async () => {
      const Component = defineComponent({
        setup() {
          return useForesight("nonexistent", { callback: vi.fn() })
        },
        render() {
          return h("button", { "data-testid": "el" })
        },
      })

      mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).not.toHaveBeenCalled()
    })

    it("unregisters on unmount with string target", async () => {
      const Component = defineComponent({
        setup() {
          return useForesight("myBtn", { callback: vi.fn() })
        },
        render() {
          return h("button", { ref: "myBtn" })
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()

      wrapper.unmount()
      expect(unregisterSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe("dynamic refs (element swaps)", () => {
    it("re-registers when ref swaps to a different element", async () => {
      const Component = defineComponent({
        setup() {
          const el = ref<HTMLElement | null>(null)
          const result = useForesight(el, { callback: vi.fn(), name: "swap" })

          return { ...result, el }
        },
        render() {
          return h("div", [
            h("button", { "data-testid": "btn-a" }),
            h("span", { "data-testid": "btn-b" }),
          ])
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()

      // Assign first element
      wrapper.vm.el = wrapper.find("[data-testid=btn-a]").element as HTMLElement
      await nextTick()
      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].element).toBe(wrapper.find("[data-testid=btn-a]").element)

      // Swap to different element
      wrapper.vm.el = wrapper.find("[data-testid=btn-b]").element as HTMLElement
      await nextTick()

      expect(unregisterSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy).toHaveBeenCalledTimes(2)
      expect(registerSpy.mock.calls[1][0].element).toBe(wrapper.find("[data-testid=btn-b]").element)
    })

    it("handles rapid element swaps correctly", async () => {
      const Component = defineComponent({
        setup() {
          const el = ref<HTMLElement | null>(null)
          const result = useForesight(el, { callback: vi.fn(), name: "rapid" })

          return { ...result, el }
        },
        render() {
          return h("div", [
            h("button", { "data-testid": "a" }),
            h("span", { "data-testid": "b" }),
            h("div", { "data-testid": "c" }),
          ])
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()

      // Assign, then immediately swap before next tick
      wrapper.vm.el = wrapper.find("[data-testid=a]").element as HTMLElement
      wrapper.vm.el = wrapper.find("[data-testid=b]").element as HTMLElement
      wrapper.vm.el = wrapper.find("[data-testid=c]").element as HTMLElement
      await nextTick()

      // flush:'post' means only the final value is observed
      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].element).toBe(wrapper.find("[data-testid=c]").element)
    })

    it("works with a getter that returns different elements", async () => {
      const Component = defineComponent({
        setup() {
          const which = ref<"a" | "b">("a")
          const elA = ref<HTMLElement | null>(null)
          const elB = ref<HTMLElement | null>(null)
          const result = useForesight(() => (which.value === "a" ? elA.value : elB.value), {
            callback: vi.fn(),
            name: "getter-swap",
          })

          return { ...result, which, elA, elB }
        },
        render() {
          return h("div", [
            h("button", { ref: "elA", "data-testid": "a" }),
            h("span", { ref: "elB", "data-testid": "b" }),
          ])
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].element).toBe(wrapper.find("[data-testid=a]").element)

      // Switch to element B
      wrapper.vm.which = "b"
      await nextTick()

      expect(unregisterSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy).toHaveBeenCalledTimes(2)
      expect(registerSpy.mock.calls[1][0].element).toBe(wrapper.find("[data-testid=b]").element)
    })
  })

  describe("comment node filtering", () => {
    it("does not register when component ref resolves to a comment node", async () => {
      const ChildComponent = defineComponent({
        props: { show: { type: Boolean, default: false } },
        render() {
          return this.show ? h("div", "visible") : null
        },
      })

      const Component = defineComponent({
        components: { ChildComponent },
        setup() {
          const childRef = ref<InstanceType<typeof ChildComponent> | null>(null)
          const result = useForesight(childRef as Ref<ComponentPublicInstance | null>, {
            callback: vi.fn(),
            name: "comment",
          })

          return { ...result, childRef }
        },
        render() {
          return h(ChildComponent, { ref: "childRef", show: false })
        },
      })

      mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).not.toHaveBeenCalled()
    })

    it("registers when component ref resolves to a real element", async () => {
      const ChildComponent = defineComponent({
        render() {
          return h("div", { "data-testid": "child-el" }, "visible")
        },
      })

      const Component = defineComponent({
        components: { ChildComponent },
        setup() {
          const childRef = ref<InstanceType<typeof ChildComponent> | null>(null)
          const result = useForesight(childRef as Ref<ComponentPublicInstance | null>, {
            callback: vi.fn(),
            name: "component-ref",
          })

          return { ...result, childRef }
        },
        render() {
          return h(ChildComponent, { ref: "childRef" })
        },
      })

      mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(HTMLDivElement)
    })

    it("registers when v-if transitions component from unmounted to mounted (ref null -> instance)", async () => {
      const ChildComponent = defineComponent({
        render() {
          return h("div", { "data-testid": "child" }, "hello")
        },
      })

      const Component = defineComponent({
        components: { ChildComponent },
        setup() {
          const show = ref(false)
          const childRef = ref<InstanceType<typeof ChildComponent> | null>(null)
          const result = useForesight(childRef as Ref<ComponentPublicInstance | null>, {
            callback: vi.fn(),
            name: "v-if-toggle",
          })

          return { ...result, show, childRef }
        },
        render() {
          return this.show ? h(ChildComponent, { ref: "childRef" }) : h("span", "placeholder")
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()

      // Initially not rendered, ref is null
      expect(registerSpy).not.toHaveBeenCalled()

      // Toggle on — ref goes from null to ComponentPublicInstance
      wrapper.vm.show = true
      await nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(HTMLDivElement)
    })

    it("does NOT auto-detect when same component instance changes $el from comment to element", async () => {
      // This test documents a known limitation: when a component INSTANCE stays
      // the same but its internal render changes (comment -> real element),
      // our watcher won't detect it because the ref value (the instance) is unchanged.
      const ChildComponent = defineComponent({
        props: { show: { type: Boolean, default: false } },
        render() {
          return this.show ? h("div", "visible") : null
        },
      })

      const Component = defineComponent({
        components: { ChildComponent },
        setup() {
          const childRef = ref<InstanceType<typeof ChildComponent> | null>(null)
          const result = useForesight(childRef as Ref<ComponentPublicInstance | null>, {
            callback: vi.fn(),
            name: "internal-toggle",
          })

          return { ...result, childRef }
        },
        render() {
          return h(ChildComponent, { ref: "childRef", show: this.show })
        },
        data() {
          return { show: false }
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).not.toHaveBeenCalled()

      // Component stays mounted, but its render output changes
      await wrapper.setData({ show: true })
      await nextTick()

      // The watcher does NOT fire because the ref still points to the same
      // ComponentPublicInstance — $el is not a reactive dependency.
      expect(registerSpy).not.toHaveBeenCalled()
    })
  })
})
