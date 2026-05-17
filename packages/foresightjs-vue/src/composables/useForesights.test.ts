import {
  computed,
  defineComponent,
  h,
  ref,
  shallowRef,
  nextTick,
  type ComponentPublicInstance,
} from "vue"
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
  it("registers all elements when targets are available", async () => {
    const Component = defineComponent({
      setup() {
        const elA = ref<HTMLElement | null>(null)
        const elB = ref<HTMLElement | null>(null)
        const states = useForesights(
          computed(() => [elA.value, elB.value]),
          [
            { name: "a", callback: vi.fn() },
            { name: "b", callback: vi.fn() },
          ]
        )

        return { states, elA, elB }
      },
      render() {
        return h("div", [
          h("button", { ref: "elA", "data-testid": "el-0" }),
          h("button", { ref: "elB", "data-testid": "el-1" }),
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
        const elA = ref<HTMLElement | null>(null)
        const elB = ref<HTMLElement | null>(null)
        const states = useForesights(
          computed(() => [elA.value, elB.value]),
          [
            { name: "a", callback: vi.fn() },
            { name: "b", callback: vi.fn() },
          ]
        )

        return { states, elA, elB }
      },
      render() {
        return h("div", [
          h("button", { ref: "elA", "data-testid": "el-0" }),
          h("button", { ref: "elB", "data-testid": "el-1" }),
        ])
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    wrapper.unmount()
    expect(unregisterSpy).toHaveBeenCalledTimes(2)
  })

  it("returns unregistered initial state before targets resolve", () => {
    const Component = defineComponent({
      setup() {
        const el = ref<HTMLElement | null>(null)
        const states = useForesights(() => [el.value], [{ callback: vi.fn() }])

        return { states }
      },
      render() {
        return h("span", {
          "data-testid": "state",
          "data-registered": this.states[0]?.isRegistered,
        })
      },
    })

    const wrapper = mount(Component)
    expect(wrapper.get("[data-testid=state]").attributes("data-registered")).toBe("false")
  })

  it("reflects state updates pushed through subscribe", async () => {
    const Component = defineComponent({
      setup() {
        const elA = ref<HTMLElement | null>(null)
        const elB = ref<HTMLElement | null>(null)
        const states = useForesights(
          computed(() => [elA.value, elB.value]),
          [
            { name: "a", callback: vi.fn() },
            { name: "b", callback: vi.fn() },
          ]
        )

        return { states, elA, elB }
      },
      render() {
        return h("div", [
          h("button", {
            ref: "elA",
            "data-testid": "el-0",
            "data-predicted": this.states[0]?.isPredicted,
          }),
          h("button", { ref: "elB", "data-testid": "el-1" }),
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
        const el = ref<HTMLElement | null>(null)
        const cb = ref<ForesightCallback>(cb1)
        const states = useForesights(
          () => [el.value],
          () => [{ name: "a", callback: cb.value }]
        )

        return { states, cb, el }
      },
      render() {
        return h("button", { ref: "el", "data-testid": "el-0" })
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
        const els = ref<(HTMLElement | null)[]>([null])
        const options = ref([{ name: "a", callback: vi.fn() }])
        const states = useForesights(() => els.value, options)

        return { states, els, options }
      },
      render() {
        return h(
          "div",
          this.els.map((_: unknown, i: number) =>
            h("button", {
              ref: (el: unknown) => {
                this.els[i] = el as HTMLElement | null
              },
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

    wrapper.vm.els = [wrapper.vm.els[0], null]
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
        const elA = ref<HTMLElement | null>(null)
        const elB = ref<HTMLElement | null>(null)
        const targets = computed(() => [elA.value, elB.value])
        const options = ref([
          { name: "a", callback: vi.fn() },
          { name: "b", callback: vi.fn() },
        ])
        const states = useForesights(() => options.value.map((_, i) => targets.value[i]), options)

        return { states, elA, elB, options }
      },
      render() {
        return h("div", [
          h("button", { ref: "elA", "data-testid": "el-0" }),
          h("button", { ref: "elB", "data-testid": "el-1" }),
        ])
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
        const el = ref<HTMLElement | null>(null)
        const name = ref("first")
        const states = useForesights(
          () => [el.value],
          () => [{ name: name.value, callback: vi.fn() }]
        )

        return { states, name, el }
      },
      render() {
        return h("button", { ref: "el", "data-testid": "el-0" })
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
        const states = useForesights(
          () => [],
          () => []
        )

        return { states }
      },
      render() {
        return h("div", `count: ${this.states.length}`)
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
        const elX = ref<HTMLElement | null>(null)
        const elY = ref<HTMLElement | null>(null)
        const elZ = ref<HTMLElement | null>(null)
        const states = useForesights(
          computed(() => [elX.value, elY.value, elZ.value]),
          [
            { name: "x", callback: vi.fn() },
            { name: "y", callback: vi.fn() },
            { name: "z", callback: vi.fn() },
          ]
        )

        return { states, elX, elY, elZ }
      },
      render() {
        return h("div", [
          h("button", { ref: "elX", "data-testid": "el-0" }),
          h("button", { ref: "elY", "data-testid": "el-1" }),
          h("button", { ref: "elZ", "data-testid": "el-2" }),
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
    it("does not register when a target resolves to a comment node", async () => {
      const ChildComponent = defineComponent({
        props: { show: { type: Boolean, default: false } },
        render() {
          return this.show ? h("div", "visible") : null
        },
      })

      const Component = defineComponent({
        components: { ChildComponent },
        setup() {
          const childRef = ref<ComponentPublicInstance | null>(null)
          const states = useForesights(
            () => [childRef.value],
            [{ callback: vi.fn(), name: "comment-slot" }]
          )

          return { states, childRef }
        },
        render() {
          return h(ChildComponent, { ref: "childRef", show: false })
        },
      })

      mount(Component, { attachTo: document.body })
      await nextTick()

      expect(registerSpy).not.toHaveBeenCalled()
    })

    it("registers when a target resolves to a real component element", async () => {
      const ChildComponent = defineComponent({
        render() {
          return h("div", { "data-testid": "child" }, "visible")
        },
      })

      const Component = defineComponent({
        components: { ChildComponent },
        setup() {
          const childRef = ref<ComponentPublicInstance | null>(null)
          const states = useForesights(
            () => [childRef.value],
            [{ callback: vi.fn(), name: "real-slot" }]
          )

          return { states, childRef }
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
  })

  describe("skip unchanged options", () => {
    it("does not call updateElementOptions when options reference is unchanged", async () => {
      const stableOpts = { name: "stable", callback: vi.fn() }
      const Component = defineComponent({
        setup() {
          const el = ref<HTMLElement | null>(null)
          const counter = ref(0)
          const states = useForesights(
            () => [el.value],
            () => [stableOpts]
          )

          return { states, counter, el }
        },
        render() {
          return h("button", {
            ref: "el",
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
          const elA = ref<HTMLElement | null>(null)
          const elB = ref<HTMLElement | null>(null)
          const options = shallowRef([optsA, optsB])
          const states = useForesights(
            computed(() => [elA.value, elB.value]),
            options
          )

          return { states, options, elA, elB }
        },
        render() {
          return h("div", [
            h("button", { ref: "elA", "data-testid": "el-0" }),
            h("button", { ref: "elB", "data-testid": "el-1" }),
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

  describe("target reactivity", () => {
    it("unregisters when a target becomes null", async () => {
      const Component = defineComponent({
        setup() {
          const el = ref<HTMLElement | null>(null)
          const states = useForesights(() => [el.value], [{ name: "removable", callback: vi.fn() }])

          return { states, el }
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

    it("handles target swap (old unregistered, new registered)", async () => {
      const Component = defineComponent({
        setup() {
          const el = ref<HTMLElement | null>(null)
          const states = useForesights(() => [el.value], [{ name: "swap", callback: vi.fn() }])

          return { states, el }
        },
        render() {
          return h("div", [h("button", { "data-testid": "a" }), h("span", { "data-testid": "b" })])
        },
      })

      const wrapper = mount(Component, { attachTo: document.body })
      await nextTick()

      wrapper.vm.el = wrapper.find("[data-testid=a]").element as HTMLElement
      await nextTick()
      expect(registerSpy).toHaveBeenCalledTimes(1)

      wrapper.vm.el = wrapper.find("[data-testid=b]").element as HTMLElement
      await nextTick()

      expect(unregisterSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy).toHaveBeenCalledTimes(2)
      expect(registerSpy.mock.calls[1][0].element).toBeInstanceOf(HTMLSpanElement)
    })

    it("resolves ComponentPublicInstance targets to their $el", async () => {
      const ChildComponent = defineComponent({
        render() {
          return h("div", { "data-testid": "child-root" }, "content")
        },
      })

      const Component = defineComponent({
        components: { ChildComponent },
        setup() {
          const childRef = ref<ComponentPublicInstance | null>(null)
          const states = useForesights(
            () => [childRef.value],
            [{ name: "comp-target", callback: vi.fn() }]
          )

          return { states, childRef }
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
  })
})
