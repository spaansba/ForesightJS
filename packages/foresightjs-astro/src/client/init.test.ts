import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ForesightElementState, ForesightRegisterOptions } from "js.foresight"

const registerSpy = vi.fn<(options: ForesightRegisterOptions) => void>()
const registeredElements = new Map<Element, unknown>()

vi.mock("js.foresight", () => ({
  ForesightManager: {
    initialize: () => ({
      registeredElements,
      register: (options: ForesightRegisterOptions) => {
        registerSpy(options)
        registeredElements.set(options.element, {})

        return { unregister: () => registeredElements.delete(options.element) }
      },
      unregister: (element: Element) => registeredElements.delete(element),
    }),
  },
}))

// resetModules gives each test a fresh `initialized` flag, so the prefetch
// stub must be re-imported to get the same instance init.ts sees.
const importInit = async () => {
  vi.resetModules()

  const { initForesight } = await import("./init")
  const { prefetch } = await import("astro:prefetch")

  return { initForesight, prefetch }
}

const addLink = (href: string, attributes: Record<string, string> = {}): HTMLAnchorElement => {
  const a = document.createElement("a")
  a.href = href

  for (const [key, value] of Object.entries(attributes)) {
    a.setAttribute(key, value)
  }

  document.body.append(a)

  return a
}

// Each test leaks the observer init.ts creates. Disconnect them so their
// queued syncLinks microtasks can't fire after jsdom is torn down.
const observers: MutationObserver[] = []
const NativeMutationObserver = MutationObserver

vi.stubGlobal(
  "MutationObserver",
  class extends NativeMutationObserver {
    constructor(callback: MutationCallback) {
      super(callback)
      observers.push(this)
    }
  }
)

beforeEach(() => {
  document.body.innerHTML = ""
  registeredElements.clear()
  registerSpy.mockClear()
})

afterEach(async () => {
  for (const observer of observers.splice(0)) {
    observer.disconnect()
  }

  await new Promise<void>(resolve => queueMicrotask(resolve))
})

describe("initForesight", () => {
  it("registers matching links and prefetches on callback", async () => {
    const link = addLink("/about", { "data-astro-prefetch": "foresight" })
    addLink("/plain")
    addLink("https://external.example.com/page", { "data-astro-prefetch": "foresight" })

    const { initForesight, prefetch } = await importInit()

    initForesight({})

    expect(registerSpy).toHaveBeenCalledTimes(1)

    const options = registerSpy.mock.calls[0][0]

    expect(options.element).toBe(link)
    options.callback({} as ForesightElementState)
    expect(prefetch).toHaveBeenCalledWith(link.href)
  })

  it("registers unattributed links in takeover mode", async () => {
    addLink("/a")
    addLink("/b", { "data-astro-prefetch": "hover" })

    const { initForesight } = await importInit()

    initForesight({ prefetchAll: true, defaultStrategy: "foresight" })

    expect(registerSpy).toHaveBeenCalledTimes(1)
  })

  it("re-scans after astro:page-load without double registering", async () => {
    addLink("/a", { "data-astro-prefetch": "foresight" })

    const { initForesight } = await importInit()

    initForesight({})
    expect(registerSpy).toHaveBeenCalledTimes(1)

    addLink("/b", { "data-astro-prefetch": "foresight" })
    document.dispatchEvent(new Event("astro:page-load"))

    expect(registerSpy).toHaveBeenCalledTimes(2)
  })

  it("picks up dynamically injected anchors via the mutation observer", async () => {
    const { initForesight } = await importInit()

    initForesight({})

    addLink("/island", { "data-astro-prefetch": "foresight" })
    await new Promise<void>(resolve => queueMicrotask(() => queueMicrotask(resolve)))

    expect(registerSpy).toHaveBeenCalledTimes(1)
  })

  it("unregisters links that left the dom after a navigation swap", async () => {
    const link = addLink("/a", { "data-astro-prefetch": "foresight" })

    const { initForesight } = await importInit()

    initForesight({})
    expect(registeredElements.has(link)).toBe(true)

    link.remove()
    document.dispatchEvent(new Event("astro:page-load"))

    expect(registeredElements.has(link)).toBe(false)
  })

  it("applies data attribute options to the registration", async () => {
    addLink("/a", {
      "data-astro-prefetch": "foresight",
      "data-foresight-hit-slop": "10 40",
      "data-foresight-name": "cta",
    })

    const { initForesight } = await importInit()

    initForesight({})

    expect(registerSpy.mock.calls[0][0]).toMatchObject({
      hitSlop: { top: 10, right: 40, bottom: 10, left: 40 },
      name: "cta",
    })
  })
})
