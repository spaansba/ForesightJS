import { defineComponent, h, ref, shallowRef, nextTick, type VNodeRef } from "vue"
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUnregisteredSnapshot, type ForesightCallback } from "js.foresight"
import { mockState, registerSpy, updateElementOptionsSpy, unregisterSpy } from "../tests/setup"
import { useForesights } from "./useForesights"

beforeEach(() => {
  registerSpy.mockClear()
  updateElementOptionsSpy.mockClear()
  unregisterSpy.mockClear()
  mockState.listeners = []
  mockState.lastCallbackWrapper = null
  mockState.currentSnapshot = createUnregisteredSnapshot(false)
})

describe("useForesights", () => {
  it("registers all elements when setRef is called", async () => {
    const Component = defineComponent({
      setup() {
        const slots = useForesights([
          { name: "a", callback: vi.fn() },
          { name: "b", callback: vi.fn() },
        ])

        return { slots }
      },
      render() {
        return h("div", [
          h("button", { ref: this.slots[0].setRef, "data-testid": "el-0" }),
          h("button", { ref: this.slots[1].setRef, "data-testid": "el-1" }),
        ])
      },
    })

    mount(Component, { attachTo: document.body })
    await nextTick()

    expect(registerSpy).toHaveBeenCalledTimes(2)
    expect(registerSpy.mock.calls[0][0].name).toBe("a")
    expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(HTMLButtonElement)
    expect(registerSpy.mock.calls[1][0].name).toBe("b")
    expect(registerSpy.mock.calls[1][0].element).toBeInstanceOf(HTMLButtonElement)
  })

  it("unregisters all on unmount", async () => {
    const Component = defineComponent({
      setup() {
        const slots = useForesights([
          { name: "a", callback: vi.fn() },
          { name: "b", callback: vi.fn() },
        ])

        return { slots }
      },
      render() {
        return h("div", [
          h("button", { ref: this.slots[0].setRef, "data-testid": "el-0" }),
          h("button", { ref: this.slots[1].setRef, "data-testid": "el-1" }),
        ])
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    wrapper.unmount()
    expect(unregisterSpy).toHaveBeenCalledTimes(2)
  })

  it("returns unregistered initial state before setRef is called", () => {
    const Component = defineComponent({
      setup() {
        const slots = useForesights([{ callback: vi.fn() }])

        return { slots }
      },
      render() {
        return h("span", {
          "data-testid": "state",
          "data-registered": this.slots[0]?.isRegistered,
        })
      },
    })

    const wrapper = mount(Component)
    expect(wrapper.get("[data-testid=state]").attributes("data-registered")).toBe("false")
  })

  it("reflects state updates pushed through subscribe", async () => {
    const Component = defineComponent({
      setup() {
        const slots = useForesights([
          { name: "a", callback: vi.fn() },
          { name: "b", callback: vi.fn() },
        ])

        return { slots }
      },
      render() {
        return h("div", [
          h("button", {
            ref: this.slots[0].setRef,
            "data-testid": "el-0",
            "data-predicted": this.slots[0]?.isPredicted,
          }),
          h("button", { ref: this.slots[1].setRef, "data-testid": "el-1" }),
        ])
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    expect(wrapper.get("[data-testid=el-0]").attributes("data-predicted")).toBe("false")

    mockState.currentSnapshot = { ...createUnregisteredSnapshot(false), isPredicted: true }
    mockState.listeners.forEach(l => l())
    await nextTick()

    expect(wrapper.get("[data-testid=el-0]").attributes("data-predicted")).toBe("true")
  })

  it("forwards the latest callback (no stale closure)", async () => {
    const cb1 = vi.fn<ForesightCallback>()
    const cb2 = vi.fn<ForesightCallback>()

    const Component = defineComponent({
      setup() {
        const cb = ref<ForesightCallback>(cb1)
        const slots = useForesights(() => [{ name: "a", callback: cb.value }])

        return { slots, cb }
      },
      render() {
        return h("button", { ref: this.slots[0].setRef, "data-testid": "el-0" })
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

  it("handles growing the array (new items added)", async () => {
    const Component = defineComponent({
      setup() {
        const options = ref([{ name: "a", callback: vi.fn() }])
        const slots = useForesights(options)

        return { slots, options }
      },
      render() {
        return h(
          "div",
          this.slots.map((slot: { setRef: VNodeRef }, i: number) =>
            h("button", {
              ref: slot.setRef,
              "data-testid": `el-${i}`,
            })
          )
        )
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    registerSpy.mockClear()

    wrapper.vm.options = [
      { name: "a", callback: vi.fn() },
      { name: "b", callback: vi.fn() },
    ]
    await nextTick()
    await nextTick()
    await nextTick()

    const names = registerSpy.mock.calls.map(c => c[0].name)
    expect(names).toContain("b")
  })

  it("handles shrinking the array (items removed)", async () => {
    const Component = defineComponent({
      setup() {
        const options = ref([
          { name: "a", callback: vi.fn() },
          { name: "b", callback: vi.fn() },
        ])
        const slots = useForesights(options)

        return { slots, options }
      },
      render() {
        return h(
          "div",
          this.slots.map((slot: { setRef: VNodeRef }, i: number) =>
            h("button", { ref: slot.setRef, "data-testid": `el-${i}` })
          )
        )
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    unregisterSpy.mockClear()
    wrapper.vm.options = [{ name: "a", callback: vi.fn() }]
    await nextTick()

    expect(unregisterSpy).toHaveBeenCalled()
  })

  it("patches options without unregistering", async () => {
    const Component = defineComponent({
      setup() {
        const name = ref("first")
        const slots = useForesights(() => [{ name: name.value, callback: vi.fn() }])

        return { slots, name }
      },
      render() {
        return h("button", { ref: this.slots[0]?.setRef, "data-testid": "el-0" })
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()
    registerSpy.mockClear()
    unregisterSpy.mockClear()

    wrapper.vm.name = "second"
    await nextTick()
    await nextTick()

    expect(updateElementOptionsSpy).toHaveBeenCalled()
    const lastCall =
      updateElementOptionsSpy.mock.calls[updateElementOptionsSpy.mock.calls.length - 1]
    expect(lastCall?.[1].name).toBe("second")
    expect(unregisterSpy).not.toHaveBeenCalled()
  })

  it("works with an empty array", async () => {
    const Component = defineComponent({
      setup() {
        const slots = useForesights(() => [])

        return { slots }
      },
      render() {
        return h("div", `count: ${this.slots.length}`)
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    expect(registerSpy).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain("count: 0")
  })

  it("registers three elements", async () => {
    const Component = defineComponent({
      setup() {
        const slots = useForesights([
          { name: "x", callback: vi.fn() },
          { name: "y", callback: vi.fn() },
          { name: "z", callback: vi.fn() },
        ])

        return { slots }
      },
      render() {
        return h("div", [
          h("button", { ref: this.slots[0].setRef, "data-testid": "el-0" }),
          h("button", { ref: this.slots[1].setRef, "data-testid": "el-1" }),
          h("button", { ref: this.slots[2].setRef, "data-testid": "el-2" }),
        ])
      },
    })

    mount(Component, { attachTo: document.body })
    await nextTick()

    expect(registerSpy).toHaveBeenCalledTimes(3)
    expect(registerSpy.mock.calls[0][0].name).toBe("x")
    expect(registerSpy.mock.calls[1][0].name).toBe("y")
    expect(registerSpy.mock.calls[2][0].name).toBe("z")
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
          const slots = useForesights([{ callback: vi.fn(), name: "comment-slot" }])

          return { slots }
        },
        render() {
          return h(ChildComponent, { ref: this.slots[0].setRef, show: false })
        },
      })

      mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).not.toHaveBeenCalled()
    })

    it("registers when setRef receives a real component element", async () => {
      const ChildComponent = defineComponent({
        render() {
          return h("div", { "data-testid": "child" }, "visible")
        },
      })

      const Component = defineComponent({
        components: { ChildComponent },
        setup() {
          const slots = useForesights([{ callback: vi.fn(), name: "real-slot" }])

          return { slots }
        },
        render() {
          return h(ChildComponent, { ref: this.slots[0].setRef })
        },
      })

      mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe("skip unchanged options", () => {
    it("does not call updateElementOptions when options reference is unchanged", async () => {
      const stableOpts = { name: "stable", callback: vi.fn() }
      const Component = defineComponent({
        setup() {
          const counter = ref(0)
          const slots = useForesights(() => [stableOpts])

          return { slots, counter }
        },
        render() {
          return h("button", {
            ref: this.slots[0].setRef,
            "data-testid": "el-0",
            "data-counter": this.counter,
          })
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()
      updateElementOptionsSpy.mockClear()

      // Force a re-evaluation but options[0] is the same object reference
      wrapper.vm.counter = 1
      await nextTick()
      await nextTick()

      expect(updateElementOptionsSpy).not.toHaveBeenCalled()
    })

    it("calls updateElementOptions only for slots whose options changed", async () => {
      const optsA = { name: "a", callback: vi.fn() }
      const optsB = { name: "b-first", callback: vi.fn() }

      const Component = defineComponent({
        setup() {
          const options = shallowRef([optsA, optsB])
          const slots = useForesights(options)

          return { slots, options }
        },
        render() {
          return h("div", [
            h("button", { ref: this.slots[0].setRef, "data-testid": "el-0" }),
            h("button", { ref: this.slots[1].setRef, "data-testid": "el-1" }),
          ])
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()
      await nextTick()
      updateElementOptionsSpy.mockClear()

      // Replace the array keeping optsA the same reference, changing only optsB
      const newOptsB = { name: "b-second", callback: vi.fn() }
      wrapper.vm.options = [optsA, newOptsB]
      await nextTick()
      await nextTick()

      // Only slot 1 should be patched (slot 0 is the same optsA reference)
      const patchedNames = updateElementOptionsSpy.mock.calls.map(c => c[1].name)
      expect(patchedNames).toContain("b-second")
      expect(patchedNames).not.toContain("a")
    })
  })

  describe("setRef reactivity", () => {
    it("unregisters when setRef receives null", async () => {
      const Component = defineComponent({
        setup() {
          const show = ref(true)
          const slots = useForesights([{ name: "removable", callback: vi.fn() }])

          return { slots, show }
        },
        render() {
          return this.show
            ? h("button", { ref: this.slots[0].setRef, "data-testid": "btn" })
            : h("span", "gone")
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()
      expect(registerSpy).toHaveBeenCalledTimes(1)

      // Toggling show will cause Vue to call setRef(null) then the element is removed
      wrapper.vm.show = false
      await nextTick()
      expect(unregisterSpy).toHaveBeenCalledTimes(1)
    })

    it("handles element swap via setRef", async () => {
      const Component = defineComponent({
        setup() {
          const useSpan = ref(false)
          const slots = useForesights([{ name: "swap", callback: vi.fn() }])

          return { slots, useSpan }
        },
        render() {
          return h("div", [
            this.useSpan
              ? h("span", { ref: this.slots[0].setRef, "data-testid": "b" })
              : h("button", { ref: this.slots[0].setRef, "data-testid": "a" }),
          ])
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()
      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(HTMLButtonElement)

      wrapper.vm.useSpan = true
      await nextTick()

      // Old element unregistered, new one registered
      expect(unregisterSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy).toHaveBeenCalledTimes(2)
      expect(registerSpy.mock.calls[1][0].element).toBeInstanceOf(HTMLSpanElement)
    })

    it("resolves ComponentPublicInstance targets via setRef", async () => {
      const ChildComponent = defineComponent({
        render() {
          return h("div", { "data-testid": "child-root" }, "content")
        },
      })

      const Component = defineComponent({
        components: { ChildComponent },
        setup() {
          const slots = useForesights([{ name: "comp-target", callback: vi.fn() }])

          return { slots }
        },
        render() {
          return h(ChildComponent, { ref: this.slots[0].setRef })
        },
      })

      mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(HTMLDivElement)
    })
  })
})
