import { act, render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  createUnregisteredSnapshot,
  type ForesightCallback,
  type ForesightRegisterOptionsWithoutElement,
} from "js.foresight"
import { mockState, registerSpy, updateElementOptionsSpy, unregisterSpy } from "../tests/setup"
import { useForesight } from "./useForesight"

beforeEach(() => {
  registerSpy.mockClear()
  updateElementOptionsSpy.mockClear()
  unregisterSpy.mockClear()
  mockState.listeners = []
  mockState.lastCallbackWrapper = null
  mockState.currentSnapshot = createUnregisteredSnapshot(false)
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
    expect(registerSpy).toHaveBeenCalled()
    const arg = registerSpy.mock.calls[0][0]
    expect(arg.element).toBeInstanceOf(HTMLButtonElement)
    expect(arg.name).toBe("x")
  })

  it("does not register when no node attaches", () => {
    render(<ButtonProbe options={{ callback: vi.fn() }} attach={false} />)
    expect(registerSpy).not.toHaveBeenCalled()
  })

  it("unregisters once on unmount", () => {
    const { unmount } = render(<ButtonProbe options={{ callback: vi.fn() }} />)
    unmount()
    expect(unregisterSpy).toHaveBeenCalledTimes(1)
  })

  it("forwards the latest callback (no stale closure across re-renders)", () => {
    const cb1 = vi.fn<ForesightCallback>()
    const cb2 = vi.fn<ForesightCallback>()
    const { rerender } = render(<ButtonProbe options={{ name: "x", callback: cb1 }} />)
    rerender(<ButtonProbe options={{ name: "x", callback: cb2 }} />)

    const fired = { ...createUnregisteredSnapshot(false), isPredicted: true }
    act(() => {
      mockState.lastCallbackWrapper?.(fired)
    })

    expect(cb1).not.toHaveBeenCalled()
    expect(cb2).toHaveBeenCalledWith(fired)
  })

  it("patches options on the same element without unregistering", () => {
    const { rerender } = render(<ButtonProbe options={{ name: "x", callback: vi.fn() }} />)
    registerSpy.mockClear()
    unregisterSpy.mockClear()

    rerender(<ButtonProbe options={{ name: "y", callback: vi.fn() }} />)

    expect(updateElementOptionsSpy).toHaveBeenCalled()
    const lastCall =
      updateElementOptionsSpy.mock.calls[updateElementOptionsSpy.mock.calls.length - 1]
    expect(lastCall?.[1].name).toBe("y")
    expect(unregisterSpy).not.toHaveBeenCalled()
  })

  it("re-runs the lifecycle when the underlying node identity swaps", () => {
    const { rerender } = render(<ButtonProbe options={{ callback: vi.fn() }} />)
    registerSpy.mockClear()
    unregisterSpy.mockClear()

    rerender(<AnchorProbe options={{ callback: vi.fn() }} />)

    expect(unregisterSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy).toHaveBeenCalled()
    const lastCall = registerSpy.mock.calls[registerSpy.mock.calls.length - 1]
    expect(lastCall?.[0].element).toBeInstanceOf(HTMLAnchorElement)
  })

  it("reflects manager state updates pushed through subscribe", () => {
    const { getByTestId } = render(<ButtonProbe options={{ callback: vi.fn() }} />)
    expect(getByTestId("el").getAttribute("data-predicted")).toBe("false")

    act(() => {
      mockState.currentSnapshot = { ...createUnregisteredSnapshot(false), isPredicted: true }
      mockState.listeners.forEach(l => l())
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
