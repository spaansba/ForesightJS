import { afterEach, describe, expect, it } from "vitest"
import { defineComponent, h, nextTick, ref, withDirectives } from "vue"
import { mount } from "@vue/test-utils"
import { ForesightManager } from "js.foresight"
import { Foresight, useForesight, vForesight } from "./index"

const { registeredElements } = ForesightManager.instance

afterEach(() => {
  document.body.innerHTML = ""
})

describe("against the real ForesightManager", () => {
  it("useForesight registers, mirrors core state, patches options and unregisters", async () => {
    const name = ref("first")
    const Comp = defineComponent({
      setup() {
        const {
          elementRef,
          isRegistered,
          name: stateName,
        } = useForesight(() => ({
          callback: () => {},
          name: name.value,
        }))

        return () => h("a", { ref: elementRef }, `${isRegistered.value}:${stateName.value}`)
      },
    })

    const wrapper = mount(Comp, { attachTo: document.body })
    const element = wrapper.element
    await nextTick()
    expect(registeredElements.has(element)).toBe(true)
    expect(wrapper.text()).toBe("true:first")

    name.value = "second"
    await nextTick()
    await nextTick()
    expect(registeredElements.get(element)?.name).toBe("second")
    expect(wrapper.text()).toBe("true:second")

    wrapper.unmount()
    expect(registeredElements.has(element)).toBe(false)
  })

  it("Foresight `as` with a multi-root component renders without registering", () => {
    const MultiRoot = defineComponent({ render: () => [h("a", "one"), h("a", "two")] })
    const before = registeredElements.size

    const wrapper = mount(Foresight, {
      props: { as: MultiRoot, callback: () => {} },
      attachTo: document.body,
    })

    expect(wrapper.findAll("a")).toHaveLength(2)
    expect(registeredElements.size).toBe(before)
    wrapper.unmount()
  })

  it("vForesight registers on mount and unregisters on unmount", () => {
    const Comp = defineComponent({
      render: () => withDirectives(h("button"), [[vForesight, () => {}]]),
    })

    const wrapper = mount(Comp, { attachTo: document.body })
    const element = wrapper.element
    expect(registeredElements.has(element)).toBe(true)

    wrapper.unmount()
    expect(registeredElements.has(element)).toBe(false)
  })
})
