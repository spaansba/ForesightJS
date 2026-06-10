import { act, render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUnregisteredSnapshot, type ForesightCallback } from "js.foresight"
import { mockState, registerSpy, updateElementOptionsSpy, unregisterSpy } from "../tests/setup"
import type { UseForesightOptions } from "../types"
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
  options: UseForesightOptions
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

  describe("enabled option", () => {
    it("registers as disabled when enabled is false", () => {
      render(<ButtonProbe options={{ callback: vi.fn(), enabled: false }} />)
      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].enabled).toBe(false)
    })

    it("registers as enabled when enabled is true (explicit)", () => {
      render(<ButtonProbe options={{ callback: vi.fn(), name: "x", enabled: true }} />)
      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].enabled).toBe(true)
    })

    it("registers when enabled is undefined (default)", () => {
      render(<ButtonProbe options={{ callback: vi.fn(), name: "x" }} />)
      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].enabled).toBeUndefined()
    })

    it("patches enabled (false → true) without re-registering", () => {
      const { rerender } = render(
        <ButtonProbe options={{ callback: vi.fn(), name: "x", enabled: false }} />
      )
      expect(registerSpy).toHaveBeenCalledTimes(1)

      rerender(<ButtonProbe options={{ callback: vi.fn(), name: "x", enabled: true }} />)
      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(updateElementOptionsSpy.mock.calls.at(-1)?.[1].enabled).toBe(true)
    })

    it("patches enabled (true → false) without unregistering", () => {
      const { rerender } = render(
        <ButtonProbe options={{ callback: vi.fn(), name: "x", enabled: true }} />
      )
      expect(registerSpy).toHaveBeenCalledTimes(1)

      rerender(<ButtonProbe options={{ callback: vi.fn(), name: "x", enabled: false }} />)
      expect(unregisterSpy).not.toHaveBeenCalled()
      expect(updateElementOptionsSpy.mock.calls.at(-1)?.[1].enabled).toBe(false)
    })
  })

  describe("meta option", () => {
    it("patches when meta content changes", () => {
      const cb = vi.fn()
      const { rerender } = render(
        <ButtonProbe options={{ name: "x", callback: cb, meta: { v: 1 } }} />
      )
      updateElementOptionsSpy.mockClear()

      rerender(<ButtonProbe options={{ name: "x", callback: cb, meta: { v: 2 } }} />)

      const metaCalls = updateElementOptionsSpy.mock.calls.filter(
        c => (c[1].meta as { v?: number } | undefined)?.v === 2
      )
      expect(metaCalls.length).toBeGreaterThan(0)
    })

    it("does not re-patch when meta content is unchanged across renders", () => {
      const cb = vi.fn()
      const { rerender } = render(
        <ButtonProbe options={{ name: "x", callback: cb, meta: { v: 1 } }} />
      )
      updateElementOptionsSpy.mockClear()

      // New object, identical content - must not trigger a patch.
      rerender(<ButtonProbe options={{ name: "x", callback: cb, meta: { v: 1 } }} />)

      expect(updateElementOptionsSpy).not.toHaveBeenCalled()
    })

    it("does not loop when an inline meta object causes patches to replace the snapshot", () => {
      // Mimic the real manager: meta is compared by identity, so every patch
      // with a fresh meta object replaces the snapshot and notifies subscribers.
      updateElementOptionsSpy.mockImplementation(() => {
        mockState.currentSnapshot = {
          ...(mockState.currentSnapshot ?? createUnregisteredSnapshot(false)),
        }
        mockState.listeners.forEach(l => l())
      })

      try {
        const InlineMetaProbe = () => {
          // meta created inside render - new identity every render
          const { elementRef } = useForesight<HTMLButtonElement>({
            name: "x",
            callback: vi.fn(),
            meta: { v: 1 },
          })

          return <button data-testid="el" ref={elementRef} />
        }

        // Without content-based meta comparison this loops:
        // patch -> new snapshot -> re-render -> new meta identity -> patch ...
        // and React throws "Maximum update depth exceeded".
        render(<InlineMetaProbe />)

        expect(updateElementOptionsSpy.mock.calls.length).toBeLessThanOrEqual(2)
      } finally {
        updateElementOptionsSpy.mockReset()
      }
    })
  })
})
