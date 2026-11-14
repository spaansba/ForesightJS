import { beforeAll, describe, expect, it } from "vitest"
import { ForesightManager } from "js.foresight"
import { initForesight } from "./init"

const { registeredElements } = ForesightManager.instance

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

beforeAll(() => {
  initForesight({ prefetchAll: true, defaultStrategy: "foresight" })
})

describe("initForesight against the real ForesightManager", () => {
  it("registers links added after init and unregisters them once removed", async () => {
    const anchor = document.createElement("a")
    anchor.href = "/later"
    document.body.append(anchor)
    await flush()
    expect(registeredElements.has(anchor)).toBe(true)

    anchor.remove()
    await flush()
    expect(registeredElements.has(anchor)).toBe(false)
  })

  it("leaves elements it did not register alone when they detach", async () => {
    const element = document.createElement("div")
    document.body.append(element)
    ForesightManager.instance.register({ element, callback: () => {} })

    element.remove()
    await flush()
    expect(registeredElements.get(element)?.isParked).toBe(true)

    document.body.append(element)
    await flush()
    expect(registeredElements.get(element)?.isParked).toBe(false)
    ForesightManager.instance.unregister(element)
  })

  it("keeps registering links after a view transition swaps the body", async () => {
    document.body.replaceWith(document.createElement("body"))
    document.dispatchEvent(new Event("astro:page-load"))

    const anchor = document.createElement("a")
    anchor.href = "/after-swap"
    document.body.append(anchor)
    await flush()
    expect(registeredElements.has(anchor)).toBe(true)
  })
})
