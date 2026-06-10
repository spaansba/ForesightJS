import { vi } from "vitest"
import type {
  ForesightCallback,
  ForesightElementState,
  ForesightRegisterOptions,
} from "js.foresight"

export const mockState = {
  listeners: [] as Array<() => void>,
  boundsListeners: [] as Array<() => void>,
  currentSnapshot: null as ForesightElementState | null,
  lastCallbackWrapper: null as ForesightCallback | null,
}

const EMPTY_RECT = { top: 0, left: 0, right: 0, bottom: 0 }

export const registerSpy = vi.fn<(opts: ForesightRegisterOptions) => void>()
export const updateElementOptionsSpy = vi.fn()
export const unregisterSpy = vi.fn<() => void>()
/* eslint-disable @typescript-eslint/no-explicit-any */
export const addEventListenerSpy =
  vi.fn<
    (type: string, listener: (...args: any[]) => void, options?: { signal?: AbortSignal }) => void
  >()
export const removeEventListenerSpy =
  vi.fn<(type: string, listener: (...args: any[]) => void) => void>()
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

          return {
            ...(mockState.currentSnapshot ?? actual.createUnregisteredSnapshot(false)),
            unregister: unregisterSpy,
            subscribe: (fn: () => void) => {
              mockState.listeners.push(fn)

              return () => {
                mockState.listeners = mockState.listeners.filter(l => l !== fn)
              }
            },
            getSnapshot: () =>
              mockState.currentSnapshot ?? actual.createUnregisteredSnapshot(false),
            subscribeToBounds: (fn: () => void) => {
              mockState.boundsListeners.push(fn)

              return () => {
                mockState.boundsListeners = mockState.boundsListeners.filter(l => l !== fn)
              }
            },
            getBounds: () => ({
              originalRect: EMPTY_RECT as DOMRectReadOnly,
              expandedRect: EMPTY_RECT,
            }),
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
        removeEventListener: removeEventListenerSpy,
      },
    },
  }
})
