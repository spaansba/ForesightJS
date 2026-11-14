import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mount, unmount, flushSync } from "svelte"
import { ForesightManager, type ForesightCallback, type ForesightElementState } from "js.foresight"
import Harness from "./Harness.svelte"
import type { ComponentProps } from "svelte"

let manager: ForesightManager
const apps: ReturnType<typeof mount>[] = []

beforeEach(async () => {
  manager = ForesightManager.initialize({
    enableTabPrediction: false,
    enableScrollPrediction: false,
  })
  await new Promise(resolve => setTimeout(resolve, 10))
})

afterEach(async () => {
  for (const app of apps.splice(0)) {
    await unmount(app)
  }

  for (const element of manager.registeredElements.keys()) {
    manager.unregister(element)
  }
})

const render = (props: ComponentProps<typeof Harness>) => {
  const app = mount(Harness, { target: document.body, props })
  apps.push(app)
  flushSync()

  return app
}

const snapshot = (): ForesightElementState =>
  JSON.parse(document.querySelector("output")!.textContent!)

// Match the core manager tests: inject a prediction hit into the real manager.
// Pointer geometry and observer timing are exercised by the core predictor tests.
const predict = async (node: Element) => {
  // @ts-expect-error - accessing private state to inject a deterministic hit
  const entry = manager.elementEntries.get(node)
  // @ts-expect-error - accessing private prediction dispatcher for integration testing
  manager.callCallback(entry, { kind: "mouse", subType: "hover" })
  await new Promise(resolve => setTimeout(resolve, 0))
  flushSync()
}

for (const mode of ["action", "reactive"] as const) {
  describe(mode, () => {
    it("registers once and unregisters on component destruction", async () => {
      const unregister = vi.spyOn(manager, "unregister")
      const app = render({ callback: vi.fn(), mode })
      const anchor = document.querySelector("a")!
      expect(manager.registeredElements.has(anchor)).toBe(true)
      expect(manager.registeredElements.size).toBe(1)
      await unmount(app)
      apps.splice(apps.indexOf(app), 1)
      expect(unregister).toHaveBeenCalledWith(anchor)
      expect(manager.registeredElements.size).toBe(0)
    })

    it("replaces reactive options including omitted defaults without reregistering", () => {
      const callback = vi.fn<ForesightCallback>()
      const props = $state<ComponentProps<typeof Harness>>({
        callback,
        options: { enabled: false, hitSlop: 30, reactivateAfter: 2000 },
        mode,
      })
      const register = vi.spyOn(manager, "register")
      const replace = vi.spyOn(manager, "replaceElementOptions")
      render(props)
      flushSync(() => {
        props.options = { enabled: true }
      })
      const latest = replace.mock.calls[replace.mock.calls.length - 1][1]
      expect(latest).toEqual({ callback, enabled: true })
      expect(register).toHaveBeenCalledTimes(1)
      if (mode === "reactive") {
        expect(snapshot().isEnabled).toBe(true)
        expect(snapshot().reactivateAfter).toBe(null) // JSON serializes Infinity as null.
        expect(snapshot().hitSlop).toEqual(manager.getManagerData.globalSettings.defaultHitSlop)
      }
    })

    it("calls the latest callback and cleans up removed and keyed elements", async () => {
      const first = vi.fn<ForesightCallback>()
      const next = vi.fn<ForesightCallback>()
      const props = $state<ComponentProps<typeof Harness>>({ callback: first, mode })
      render(props)
      flushSync(() => {
        props.callback = next
      })
      const oldAnchor = document.querySelector("a")!
      await predict(oldAnchor)
      expect(first).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledTimes(1)
      flushSync(() => (document.querySelectorAll("button")[1] as HTMLButtonElement).click())
      expect(manager.registeredElements.has(oldAnchor)).toBe(false)
      expect(document.querySelector("a")).not.toBe(oldAnchor)
      await predict(document.querySelector("a")!)
      expect(next).toHaveBeenCalledTimes(2)
      flushSync(() => (document.querySelector("button") as HTMLButtonElement).click())
      expect(manager.registeredElements.size).toBe(0)
      flushSync(() => (document.querySelector("button") as HTMLButtonElement).click())
      expect(manager.registeredElements.size).toBe(1)
    })
  })
}

it("publishes immutable snapshots through prediction and completion, then unsubscribes", async () => {
  render({ callback: vi.fn() })
  expect(snapshot().isRegistered).toBe(true)
  expect(snapshot().isPredicted).toBe(false)
  await predict(document.querySelector("a")!)
  expect(snapshot().isPredicted).toBe(true)
  expect(snapshot().hitCount).toBe(1)
  expect(snapshot().isCallbackRunning).toBe(false)
  flushSync(() => (document.querySelector("button") as HTMLButtonElement).click())
  expect(snapshot().isRegistered).toBe(false)
})

it("stops manager event subscriptions on component destruction", async () => {
  const callback = vi.fn()
  const onRegistered = vi.fn()
  const app = render({ callback, onRegistered })
  const element = document.createElement("a")
  manager.register({ element, callback })
  expect(onRegistered).toHaveBeenCalledTimes(1)
  await unmount(app)
  apps.splice(apps.indexOf(app), 1)
  manager.register({ element: document.createElement("a"), callback })
  expect(onRegistered).toHaveBeenCalledTimes(1)
})

it("suppresses disabled callbacks and reacts when enabled", async () => {
  const callback = vi.fn()
  const props = $state<ComponentProps<typeof Harness>>({ callback, options: { enabled: false } })
  render(props)
  const anchor = document.querySelector("a")!
  expect(snapshot().isEnabled).toBe(false)
  await predict(anchor)
  expect(callback).not.toHaveBeenCalled()
  flushSync(() => {
    props.options = { enabled: true }
  })
  await predict(anchor)
  expect(callback).toHaveBeenCalledTimes(1)
})

it("tracks an async callback and ignores its completion after destruction", async () => {
  let complete!: () => void
  render({
    callback: () =>
      new Promise<void>(resolve => {
        complete = resolve
      }),
  })
  await predict(document.querySelector("a")!)
  expect(snapshot().isCallbackRunning).toBe(true)
  flushSync(() => (document.querySelector("button") as HTMLButtonElement).click())
  expect(snapshot().isRegistered).toBe(false)
  complete()
  await new Promise(resolve => setTimeout(resolve, 0))
  flushSync()
  expect(snapshot().isRegistered).toBe(false)
  expect(snapshot().isCallbackRunning).toBe(false)
})

it("reflects callback failures in the snapshot", async () => {
  render({
    callback: async () => {
      throw new Error("preload failed")
    },
  })
  await predict(document.querySelector("a")!)
  expect(snapshot().error).toBe("preload failed")
  expect(snapshot().isCallbackRunning).toBe(false)
})

it("does not patch an element unregistered externally", () => {
  const props = $state<ComponentProps<typeof Harness>>({ callback: vi.fn() })
  render(props)
  manager.unregister(document.querySelector("a")!)
  expect(() =>
    flushSync(() => {
      props.options = { enabled: false }
    })
  ).not.toThrow()
})
