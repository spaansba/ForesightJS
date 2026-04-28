import { act, render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  createUnregisteredSnapshot,
  type ForesightCallback,
  type ForesightElementState,
  type ForesightRegisterOptions,
  type ForesightRegisterOptionsWithoutElement,
} from "js.foresight"
import { useForesight } from "./useForesight"

const mocks = vi.hoisted(() => ({
  state: {
    listeners: [] as Array<() => void>,
    currentSnapshot: null as ForesightElementState | null,
    lastCallbackWrapper: null as ForesightCallback | null,
  },
  registerSpy: vi.fn<(opts: ForesightRegisterOptions) => void>(),
  unregisterSpy: vi.fn<() => void>(),
}))

vi.mock("js.foresight", async importOriginal => {
  const actual = await importOriginal<typeof import("js.foresight")>()

  return {
    ...actual,
    ForesightManager: {
      instance: {
        register: (opts: ForesightRegisterOptions) => {
          mocks.registerSpy(opts)
          mocks.state.lastCallbackWrapper = opts.callback

          return {
            ...(mocks.state.currentSnapshot ?? actual.createUnregisteredSnapshot(false)),
            unregister: mocks.unregisterSpy,
            subscribe: (fn: () => void) => {
              mocks.state.listeners.push(fn)

              return () => {
                mocks.state.listeners = mocks.state.listeners.filter(l => l !== fn)
              }
            },
            getSnapshot: () =>
              mocks.state.currentSnapshot ?? actual.createUnregisteredSnapshot(false),
          }
        },
      },
    },
  }
})

beforeEach(() => {
  mocks.registerSpy.mockClear()
  mocks.unregisterSpy.mockClear()
  mocks.state.listeners = []
  mocks.state.lastCallbackWrapper = null
  mocks.state.currentSnapshot = createUnregisteredSnapshot(false)
})

type ProbeProps = {
  options: ForesightRegisterOptionsWithoutElement
  attach?: boolean
}

const ButtonProbe = ({ options, attach = true }: ProbeProps) => {
  const { elementRef, isPredicted, isRegistered } = useForesight<HTMLButtonElement>(options)
  if (!attach) {
    return null
  }

  return (
    <button
      data-testid="el"
      data-predicted={isPredicted}
      data-registered={isRegistered}
      ref={elementRef}
    />
  )
}

const AnchorProbe = ({ options }: ProbeProps) => {
  const { elementRef, isPredicted, isRegistered } = useForesight<HTMLAnchorElement>(options)

  return (
    <a
      data-testid="el"
      data-predicted={isPredicted}
      data-registered={isRegistered}
      ref={elementRef}
    />
  )
}

describe("useForesight", () => {
  it("registers when the ref attaches a DOM node", () => {
    render(<ButtonProbe options={{ name: "x", callback: vi.fn() }} />)
    expect(mocks.registerSpy).toHaveBeenCalled()
    const arg = mocks.registerSpy.mock.calls[0][0]
    expect(arg.element).toBeInstanceOf(HTMLButtonElement)
    expect(arg.name).toBe("x")
  })

  it("does not register when no node attaches", () => {
    render(<ButtonProbe options={{ callback: vi.fn() }} attach={false} />)
    expect(mocks.registerSpy).not.toHaveBeenCalled()
  })

  it("unregisters once on unmount", () => {
    const { unmount } = render(<ButtonProbe options={{ callback: vi.fn() }} />)
    unmount()
    expect(mocks.unregisterSpy).toHaveBeenCalledTimes(1)
  })

  it("forwards the latest callback (no stale closure across re-renders)", () => {
    const cb1 = vi.fn<ForesightCallback>()
    const cb2 = vi.fn<ForesightCallback>()
    const { rerender } = render(<ButtonProbe options={{ name: "x", callback: cb1 }} />)
    rerender(<ButtonProbe options={{ name: "x", callback: cb2 }} />)

    const fired = { ...createUnregisteredSnapshot(false), isPredicted: true }
    act(() => {
      mocks.state.lastCallbackWrapper?.(fired)
    })

    expect(cb1).not.toHaveBeenCalled()
    expect(cb2).toHaveBeenCalledWith(fired)
  })

  it("patches options on the same element without unregistering", () => {
    const { rerender } = render(<ButtonProbe options={{ name: "x", callback: vi.fn() }} />)
    mocks.registerSpy.mockClear()
    mocks.unregisterSpy.mockClear()

    rerender(<ButtonProbe options={{ name: "y", callback: vi.fn() }} />)

    expect(mocks.registerSpy).toHaveBeenCalled()
    const lastCall = mocks.registerSpy.mock.calls[mocks.registerSpy.mock.calls.length - 1]
    expect(lastCall?.[0].name).toBe("y")
    expect(mocks.unregisterSpy).not.toHaveBeenCalled()
  })

  it("re-runs the lifecycle when the underlying node identity swaps", () => {
    const { rerender } = render(<ButtonProbe options={{ callback: vi.fn() }} />)
    mocks.registerSpy.mockClear()
    mocks.unregisterSpy.mockClear()

    rerender(<AnchorProbe options={{ callback: vi.fn() }} />)

    expect(mocks.unregisterSpy).toHaveBeenCalledTimes(1)
    expect(mocks.registerSpy).toHaveBeenCalled()
    const lastCall = mocks.registerSpy.mock.calls[mocks.registerSpy.mock.calls.length - 1]
    expect(lastCall?.[0].element).toBeInstanceOf(HTMLAnchorElement)
  })

  it("reflects manager state updates pushed through subscribe", () => {
    const { getByTestId } = render(<ButtonProbe options={{ callback: vi.fn() }} />)
    expect(getByTestId("el").getAttribute("data-predicted")).toBe("false")

    act(() => {
      mocks.state.currentSnapshot = { ...createUnregisteredSnapshot(false), isPredicted: true }
      mocks.state.listeners.forEach(l => l())
    })

    expect(getByTestId("el").getAttribute("data-predicted")).toBe("true")
  })

  it("returns the unregistered initial snapshot before any node attaches", () => {
    const Capture = () => {
      const { isRegistered } = useForesight({ callback: vi.fn() })

      return <span data-testid="state" data-registered={isRegistered} />
    }
    const { getByTestId } = render(<Capture />)
    expect(getByTestId("state").getAttribute("data-registered")).toBe("false")
  })
})
