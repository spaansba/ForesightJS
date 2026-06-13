import { defineComponent, h, nextTick, type PropType } from "vue"
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockState, registerSpy, updateElementOptionsSpy, unregisterSpy } from "../tests/setup"
import { emitSnapshot } from "../tests/helpers"
import type { ForesightSlotProps } from "../types"
import Foresight from "./Foresight.vue"

beforeEach(() => {
  registerSpy.mockClear()
  updateElementOptionsSpy.mockClear()
  unregisterSpy.mockClear()
  mockState.listeners = []
  mockState.lastCallbackWrapper = null
  mockState.currentSnapshot = null
})

type Item = { id: string; label: string }

const List = defineComponent({
  props: {
    items: { type: Array as PropType<Item[]>, required: true },
  },
  render() {
    return h(
      "div",
      this.items.map(item =>
        h(
          Foresight,
          { key: item.id, foresightName: item.label, callback: vi.fn() },
          {
            default: ({ elementRef, isPredicted }: ForesightSlotProps) =>
              h(
                "button",
                { ref: elementRef, "data-testid": `el-${item.id}` },
                isPredicted ? "hot" : "cold"
              ),
          }
        )
      )
    )
  },
})

describe("Foresight", () => {
  it("registers when the ref attaches and passes state to the slot", async () => {
    const wrapper = mount(List, {
      props: { items: [{ id: "1", label: "a" }] },
      attachTo: document.body,
    })
    await nextTick()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy.mock.calls[0][0].name).toBe("a")
    expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(HTMLButtonElement)
    expect(wrapper.get('[data-testid="el-1"]').text()).toBe("cold")
  })

  it("unregisters on unmount", async () => {
    const wrapper = mount(List, {
      props: { items: [{ id: "1", label: "a" }] },
      attachTo: document.body,
    })
    await nextTick()

    wrapper.unmount()
    expect(unregisterSpy).toHaveBeenCalledTimes(1)
  })

  it("only registers the new item when the list grows", async () => {
    const wrapper = mount(List, {
      props: { items: [{ id: "1", label: "a" }] },
      attachTo: document.body,
    })
    await nextTick()
    registerSpy.mockClear()
    unregisterSpy.mockClear()

    await wrapper.setProps({
      items: [
        { id: "1", label: "a" },
        { id: "2", label: "b" },
      ],
    })
    await nextTick()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy.mock.calls[0][0].name).toBe("b")
    expect(unregisterSpy).not.toHaveBeenCalled()
  })

  it("reflects state updates pushed through subscribe", async () => {
    const wrapper = mount(List, {
      props: { items: [{ id: "1", label: "a" }] },
      attachTo: document.body,
    })
    await nextTick()
    expect(wrapper.get('[data-testid="el-1"]').text()).toBe("cold")

    await emitSnapshot({ isPredicted: true })

    expect(wrapper.get('[data-testid="el-1"]').text()).toBe("hot")
  })

  it("patches option changes without re-registering", async () => {
    const wrapper = mount(List, {
      props: { items: [{ id: "1", label: "a" }] },
      attachTo: document.body,
    })
    await nextTick()
    registerSpy.mockClear()
    unregisterSpy.mockClear()

    await wrapper.setProps({ items: [{ id: "1", label: "renamed" }] })
    await nextTick()

    expect(registerSpy).not.toHaveBeenCalled()
    expect(unregisterSpy).not.toHaveBeenCalled()
    expect(updateElementOptionsSpy.mock.calls.at(-1)?.[1].name).toBe("renamed")
  })

  describe("as form", () => {
    it("renders the tag itself and registers it", async () => {
      const wrapper = mount(Foresight, {
        props: { as: "button", foresightName: "checkout", callback: vi.fn() },
        attrs: { "data-testid": "btn" },
        slots: { default: () => "Checkout" },
        attachTo: document.body,
      })
      await nextTick()

      const button = wrapper.get('[data-testid="btn"]')
      expect(button.element.tagName).toBe("BUTTON")
      expect(button.text()).toBe("Checkout")
      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].name).toBe("checkout")
      expect(registerSpy.mock.calls[0][0].element).toBe(button.element)
    })

    it("forwards fallthrough attrs (incl. name) and keeps foresight options off the DOM", async () => {
      const onClick = vi.fn()
      const wrapper = mount(Foresight, {
        props: { as: "button", foresightName: "checkout", hitSlop: 20, callback: vi.fn() },
        attrs: { "data-testid": "btn", class: "checkout", name: "dom-name", onClick },
        slots: { default: () => "Checkout" },
        attachTo: document.body,
      })
      await nextTick()

      const button = wrapper.get('[data-testid="btn"]')
      expect(button.element.className).toBe("checkout")
      expect(button.element.getAttribute("name")).toBe("dom-name")
      expect(button.element.hasAttribute("foresightname")).toBe(false)
      expect(button.element.hasAttribute("foresight-name")).toBe(false)
      expect(button.element.hasAttribute("hitslop")).toBe(false)
      expect(button.element.hasAttribute("hit-slop")).toBe(false)
      await button.trigger("click")
      expect(onClick).toHaveBeenCalled()
      expect(registerSpy.mock.calls[0][0].name).toBe("checkout")
      expect(registerSpy.mock.calls[0][0].hitSlop).toBe(20)
    })

    it("passes state to the scoped slot", async () => {
      const wrapper = mount(Foresight, {
        props: { as: "button", callback: vi.fn() },
        attrs: { "data-testid": "btn" },
        slots: {
          default: ({ isPredicted }: ForesightSlotProps) => h("span", isPredicted ? "hot" : "cold"),
        },
        attachTo: document.body,
      })
      await nextTick()
      expect(wrapper.get('[data-testid="btn"]').text()).toBe("cold")

      await emitSnapshot({ isPredicted: true })

      expect(wrapper.get('[data-testid="btn"]').text()).toBe("hot")
    })

    it("subscribes exactly once regardless of slot usage", async () => {
      mount(Foresight, {
        props: { as: "button", callback: vi.fn() },
        slots: { default: () => "Checkout" },
        attachTo: document.body,
      })
      await nextTick()

      // The scoped slot reads the single reactive snapshot, and the manager
      // mirrors the data attributes itself - there must be no second
      // manager subscription.
      expect(mockState.listeners).toHaveLength(1)
    })

    it("re-registers the swapped element", async () => {
      const wrapper = mount(Foresight, {
        props: { as: "button", callback: vi.fn() },
        attrs: { "data-testid": "el" },
        slots: { default: () => "content" },
        attachTo: document.body,
      })
      await nextTick()
      registerSpy.mockClear()
      unregisterSpy.mockClear()

      await wrapper.setProps({ as: "a" })
      await nextTick()

      const link = wrapper.get('[data-testid="el"]').element
      expect(link.tagName).toBe("A")
      // The element swap tears down the old registration and registers the new
      // element.
      expect(unregisterSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls.at(-1)?.[0].element).toBe(link)
    })

    it("unregisters on unmount", async () => {
      const wrapper = mount(Foresight, {
        props: { as: "div", callback: vi.fn() },
        slots: { default: () => "content" },
        attachTo: document.body,
      })
      await nextTick()

      wrapper.unmount()
      expect(unregisterSpy).toHaveBeenCalledTimes(1)
    })

    it("registers with enabled undefined when the prop is absent", async () => {
      mount(Foresight, {
        props: { as: "button", callback: vi.fn() },
        slots: { default: () => "Checkout" },
        attachTo: document.body,
      })
      await nextTick()

      expect(registerSpy.mock.calls[0][0].enabled).toBeUndefined()
    })

    it("registers the root element when as is a component", async () => {
      const Child = defineComponent({
        render() {
          return h("button", { "data-testid": "child-btn" }, "child")
        },
      })

      const wrapper = mount(Foresight, {
        props: { as: Child, callback: vi.fn() },
        attachTo: document.body,
      })
      await nextTick()

      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].element).toBe(
        wrapper.get('[data-testid="child-btn"]').element
      )
    })
  })
})
