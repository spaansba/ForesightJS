import { beforeEach, vi } from "vitest"
import type {
  ForesightCallback,
  ForesightElementState,
  ForesightRegisterOptions,
  ForesightRegisterOptionsWithoutElement,
} from "js.foresight"

export const mockState = {
  listeners: [] as Array<() => void>,
  currentSnapshot: null as ForesightElementState | null,
  lastCallbackWrapper: null as ForesightCallback | null,
  registeredElements: new Set<Element>(),
}

beforeEach(() => {
  mockState.registeredElements.clear()
})

export const registerSpy = vi.fn<(opts: ForesightRegisterOptions) => void>()
export const updateElementOptionsSpy =
  vi.fn<(element: unknown, opts: Partial<ForesightRegisterOptionsWithoutElement>) => void>()
export const unregisterSpy = vi.fn<() => void>()
/* eslint-disable @typescript-eslint/no-explicit-any */
export const addEventListenerSpy =
  vi.fn<
    (type: string, listener: (...args: any[]) => void, options?: { signal?: AbortSignal }) => void
  >()
/* eslint-enable @typescript-eslint/no-explicit-any */

vi.mock("js.foresight", async importOriginal => {
  const actual = await importOriginal<typeof import("js.foresight")>()

  return {
    ...actual,
    ForesightManager: {
      instance: {
        register: (opts: ForesightRegisterOptions) => {
          registerSpy(opts)
          mockState.lastCallbackWrapper = opts.callback
          mockState.registeredElements.add(opts.element)

          return {
            ...(mockState.currentSnapshot ?? actual.createUnregisteredSnapshot(false)),
            unregister: () => {
              mockState.registeredElements.delete(opts.element)
              unregisterSpy()
            },
            subscribe: (fn: () => void) => {
              mockState.listeners.push(fn)

              return () => {
                mockState.listeners = mockState.listeners.filter(l => l !== fn)
              }
            },
            getSnapshot: () =>
              mockState.currentSnapshot ?? actual.createUnregisteredSnapshot(false),
          }
        },
        updateElementOptions: (
          _element: unknown,
          opts: Partial<{ callback: ForesightCallback }>
        ) => {
          updateElementOptionsSpy(_element, opts)
          if (opts.callback) {
            mockState.lastCallbackWrapper = opts.callback
          }
        },
        addEventListener: addEventListenerSpy,
        registeredElements: mockState.registeredElements,
      },
    },
  }
})
