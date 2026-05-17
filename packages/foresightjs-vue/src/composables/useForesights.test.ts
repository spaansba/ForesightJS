import { defineComponent, h, ref, nextTick } from "vue"
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUnregisteredSnapshot, type ForesightCallback } from "js.foresight"
import { mockState, registerSpy, updateElementOptionsSpy, unregisterSpy } from "../tests/setup"
import { useForesights, type UseForesightsSlot } from "./useForesights"

beforeEach(() => {
  registerSpy.mockClear()
  updateElementOptionsSpy.mockClear()
  unregisterSpy.mockClear()
  mockState.listeners = []
  mockState.lastCallbackWrapper = null
  mockState.currentSnapshot = createUnregisteredSnapshot(false)
})

describe("useForesights", () => {
  it("registers all elements when refs attach", async () => {
    const Component = defineComponent({
      setup() {
        const slots = useForesights([
          { name: "a", callback: vi.fn() },
          { name: "b", callback: vi.fn() },
        ])
        return { slots }
      },
      render() {
        return h(
          "div",
          this.slots.map((slot: UseForesightsSlot, i: number) =>
            h("button", { ref: slot.setRef, "data-testid": `el-${i}` })
          )
        )
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
        return h(
          "div",
          this.slots.map((slot: UseForesightsSlot, i: number) =>
            h("button", { ref: slot.setRef, "data-testid": `el-${i}` })
          )
        )
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    wrapper.unmount()
    expect(unregisterSpy).toHaveBeenCalledTimes(2)
  })

  it("returns unregistered initial state before refs attach", () => {
    const Component = defineComponent({
      setup() {
        const slots = useForesights([{ callback: vi.fn() }])
        return { slots }
      },
      render() {
        return h("span", {
          "data-testid": "state",
          "data-registered": this.slots[0]?.state.isRegistered,
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
        return h(
          "div",
          this.slots.map((slot: UseForesightsSlot, i: number) =>
            h("button", {
              ref: slot.setRef,
              "data-testid": `el-${i}`,
              "data-predicted": slot.state.isPredicted,
            })
          )
        )
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
        return h(
          "div",
          this.slots.map((slot: UseForesightsSlot, i: number) =>
            h("button", { ref: slot.setRef, "data-testid": `el-${i}` })
          )
        )
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
          this.slots.map((slot: UseForesightsSlot, i: number) =>
            h("button", { ref: slot.setRef, "data-testid": `el-${i}` })
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
          this.slots.map((slot: UseForesightsSlot, i: number) =>
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
        return h(
          "div",
          this.slots.map((slot: UseForesightsSlot, i: number) =>
            h("button", { ref: slot.setRef, "data-testid": `el-${i}` })
          )
        )
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
        const slots = useForesights([])
        return { slots }
      },
      render() {
        return h(
          "div",
          this.slots.map((slot: UseForesightsSlot, i: number) =>
            h("button", { ref: slot.setRef, "data-testid": `el-${i}` })
          )
        )
      },
    })

    const wrapper = mount(Component, { attachTo: document.body })
    await nextTick()

    expect(registerSpy).not.toHaveBeenCalled()
    expect(wrapper.findAll("button")).toHaveLength(0)
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
        return h(
          "div",
          this.slots.map((slot: UseForesightsSlot, i: number) =>
            h("button", { ref: slot.setRef, "data-testid": `el-${i}` })
          )
        )
      },
    })

    mount(Component, { attachTo: document.body })
    await nextTick()

    expect(registerSpy).toHaveBeenCalledTimes(3)
    expect(registerSpy.mock.calls[0][0].name).toBe("x")
    expect(registerSpy.mock.calls[1][0].name).toBe("y")
    expect(registerSpy.mock.calls[2][0].name).toBe("z")
  })
})
