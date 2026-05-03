import { defineComponent, h, nextTick, ref } from "vue"
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUnregisteredSnapshot, type ForesightCallback } from "js.foresight"
import { mockState, registerSpy, unregisterSpy } from "../tests/setup"
import { useForesight } from "./useForesight"

beforeEach(() => {
  registerSpy.mockClear()
  unregisterSpy.mockClear()
  mockState.listeners = []
  mockState.lastCallbackWrapper = null
  mockState.currentSnapshot = createUnregisteredSnapshot(false)
})

describe("useForesight", () => {
  it("registers the element on mount using templateRefKey", async () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        return useForesight(() => ({
          templateRefKey: "myBtn",
          callback: cb,
          name: "test-btn",
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
    expect(arg.element).toBeInstanceOf(HTMLButtonElement)
    expect(arg.name).toBe("test-btn")
  })

  it("accepts a plain object (not just a getter)", async () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        return useForesight({
          templateRefKey: "myBtn",
          callback: cb,
          name: "plain-obj",
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
    expect(arg.name).toBe("plain-obj")
  })

  it("does not register when templateRef resolves to null", async () => {
    const Component = defineComponent({
      setup() {
        return useForesight(() => ({
          templateRefKey: "nonExistent",
          callback: vi.fn(),
        }))
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
        return useForesight(() => ({
          templateRefKey: "myBtn",
          callback: vi.fn(),
        }))
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

  it("forwards the callback to the manager", async () => {
    const cb = vi.fn()
    const Component = defineComponent({
      setup() {
        return useForesight(() => ({
          templateRefKey: "myBtn",
          callback: cb,
        }))
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
        const { isRegistered } = useForesight(() => ({
          templateRefKey: "myBtn",
          callback: vi.fn(),
        }))

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
        const { isPredicted } = useForesight(() => ({
          templateRefKey: "myBtn",
          callback: vi.fn(),
        }))

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
        const cb = ref<ForesightCallback>(cb1)
        const result = useForesight(() => ({
          templateRefKey: "myBtn",
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
        const name = ref("first")
        const result = useForesight(() => ({
          templateRefKey: "myBtn",
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

    expect(registerSpy).toHaveBeenCalled()
    const lastCall = registerSpy.mock.calls[registerSpy.mock.calls.length - 1]
    expect(lastCall?.[0].name).toBe("second")
    expect(unregisterSpy).not.toHaveBeenCalled()
  })
})
