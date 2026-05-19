import { defineComponent, h, ref, nextTick } from "vue"
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ForesightEvent } from "js.foresight"
import { addEventListenerSpy } from "../tests/setup"
import { useForesightEvent } from "./useForesightEvent"

beforeEach(() => {
  addEventListenerSpy.mockClear()
})

describe("useForesightEvent", () => {
  it("subscribes to the event on mount", () => {
    const listener = vi.fn()
    const Component = defineComponent({
      setup() {
        useForesightEvent("callbackCompleted", listener)
      },
      render() {
        return h("span")
      },
    })

    mount(Component)

    expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
    expect(addEventListenerSpy).toHaveBeenCalledWith("callbackCompleted", expect.any(Function), {
      signal: expect.any(AbortSignal),
    })
  })

  it("aborts the signal on unmount", () => {
    const listener = vi.fn()
    const Component = defineComponent({
      setup() {
        useForesightEvent("callbackCompleted", listener)
      },
      render() {
        return h("span")
      },
    })

    const wrapper = mount(Component)

    const signal = addEventListenerSpy.mock.calls[0]![2]!.signal as AbortSignal
    expect(signal.aborted).toBe(false)

    wrapper.unmount()

    expect(signal.aborted).toBe(true)
  })

  it("forwards events to the listener", () => {
    const listener = vi.fn()
    const Component = defineComponent({
      setup() {
        useForesightEvent("callbackCompleted", listener)
      },
      render() {
        return h("span")
      },
    })

    mount(Component)

    const registeredListener = addEventListenerSpy.mock.calls[0][1]
    const fakeEvent = { type: "callbackCompleted", timestamp: 1 }

    registeredListener(fakeEvent)

    expect(listener).toHaveBeenCalledWith(fakeEvent)
  })

  it("always calls the latest listener (no stale closure)", async () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    const Component = defineComponent({
      setup() {
        const cb = ref(listener1)
        useForesightEvent("callbackCompleted", cb)

        return { cb }
      },
      render() {
        return h("span")
      },
    })

    const wrapper = mount(Component)
    wrapper.vm.cb = listener2
    await nextTick()

    const registeredListener = addEventListenerSpy.mock.calls[0][1]
    const fakeEvent = { type: "callbackCompleted", timestamp: 1 }
    registeredListener(fakeEvent)

    expect(listener1).not.toHaveBeenCalled()
    expect(listener2).toHaveBeenCalledWith(fakeEvent)
  })

  it("does not re-subscribe when only the listener reference changes", async () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    const Component = defineComponent({
      setup() {
        const cb = ref(listener1)
        useForesightEvent("callbackCompleted", cb)

        return { cb }
      },
      render() {
        return h("span")
      },
    })

    const wrapper = mount(Component)
    wrapper.vm.cb = listener2
    await nextTick()

    // Should still be only one subscription - the initial one
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
  })

  it("re-subscribes when the event type changes", async () => {
    const listener = vi.fn()

    const Component = defineComponent({
      setup() {
        const eventType = ref<ForesightEvent>("callbackCompleted")
        useForesightEvent(() => eventType.value, listener)

        return { eventType }
      },
      render() {
        return h("span")
      },
    })

    const wrapper = mount(Component)

    const firstSignal = addEventListenerSpy.mock.calls[0]![2]!.signal as AbortSignal
    addEventListenerSpy.mockClear()

    wrapper.vm.eventType = "elementRegistered"
    await nextTick()

    expect(firstSignal.aborted).toBe(true)
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
    expect(addEventListenerSpy).toHaveBeenCalledWith("elementRegistered", expect.any(Function), {
      signal: expect.any(AbortSignal),
    })
  })
})
