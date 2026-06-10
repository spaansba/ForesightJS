import { act, render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUnregisteredSnapshot } from "js.foresight"
import { mockState, registerSpy, updateElementOptionsSpy, unregisterSpy } from "../tests/setup"
import type { UseForesightOptions } from "../types"
import { useForesights } from "./useForesights"

beforeEach(() => {
  registerSpy.mockClear()
  updateElementOptionsSpy.mockClear()
  unregisterSpy.mockClear()
  mockState.listeners = []
  mockState.lastCallbackWrapper = null
  mockState.currentSnapshot = createUnregisteredSnapshot(false)
})

type ProbeProps = {
  optionsArray: UseForesightOptions[]
}

const MultiProbe = ({ optionsArray }: ProbeProps) => {
  const results = useForesights<HTMLButtonElement>(optionsArray)

  return (
    <div>
      {results.map((r, i) => (
        <button
          key={i}
          data-testid={`el-${i}`}
          data-predicted={r.isPredicted}
          data-registered={r.isRegistered}
          ref={r.elementRef}
        />
      ))}
    </div>
  )
}

describe("useForesights", () => {
  it("registers all elements when refs attach", () => {
    render(
      <MultiProbe
        optionsArray={[
          { name: "a", callback: vi.fn() },
          { name: "b", callback: vi.fn() },
        ]}
      />
    )
    expect(registerSpy).toHaveBeenCalledTimes(2)
    expect(registerSpy.mock.calls[0][0].name).toBe("a")
    expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(HTMLButtonElement)
    expect(registerSpy.mock.calls[1][0].name).toBe("b")
    expect(registerSpy.mock.calls[1][0].element).toBeInstanceOf(HTMLButtonElement)
  })

  it("unregisters all on unmount", () => {
    const { unmount } = render(
      <MultiProbe
        optionsArray={[
          { name: "a", callback: vi.fn() },
          { name: "b", callback: vi.fn() },
        ]}
      />
    )
    unmount()
    expect(unregisterSpy).toHaveBeenCalledTimes(2)
  })

  it("returns unregistered initial snapshot before nodes attach", () => {
    const NoRefProbe = () => {
      const results = useForesights([{ callback: vi.fn() }])

      return <span data-testid="state" data-registered={results[0].isRegistered} />
    }
    const { getByTestId } = render(<NoRefProbe />)
    expect(getByTestId("state").getAttribute("data-registered")).toBe("false")
  })

  it("reflects state updates pushed through subscribe", async () => {
    const { getByTestId } = render(
      <MultiProbe
        optionsArray={[
          { name: "a", callback: vi.fn() },
          { name: "b", callback: vi.fn() },
        ]}
      />
    )

    expect(getByTestId("el-0").getAttribute("data-predicted")).toBe("false")

    await act(async () => {
      mockState.currentSnapshot = { ...createUnregisteredSnapshot(false), isPredicted: true }
      mockState.listeners.forEach(l => l())
    })

    expect(getByTestId("el-0").getAttribute("data-predicted")).toBe("true")
  })

  it("forwards the latest callback (no stale closure)", () => {
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    const { rerender } = render(<MultiProbe optionsArray={[{ name: "a", callback: cb1 }]} />)
    rerender(<MultiProbe optionsArray={[{ name: "a", callback: cb2 }]} />)

    const fired = { ...createUnregisteredSnapshot(false), isPredicted: true }
    act(() => {
      mockState.lastCallbackWrapper?.(fired)
    })

    expect(cb1).not.toHaveBeenCalled()
    expect(cb2).toHaveBeenCalledWith(fired)
  })

  it("handles growing the array (new items added)", () => {
    const { rerender } = render(<MultiProbe optionsArray={[{ name: "a", callback: vi.fn() }]} />)
    expect(registerSpy).toHaveBeenCalledTimes(1)

    registerSpy.mockClear()
    rerender(
      <MultiProbe
        optionsArray={[
          { name: "a", callback: vi.fn() },
          { name: "b", callback: vi.fn() },
        ]}
      />
    )

    // Should register the new element (and possibly re-register existing)
    const names = registerSpy.mock.calls.map(c => c[0].name)
    expect(names).toContain("b")
  })

  it("handles shrinking the array (items removed)", () => {
    const { rerender } = render(
      <MultiProbe
        optionsArray={[
          { name: "a", callback: vi.fn() },
          { name: "b", callback: vi.fn() },
        ]}
      />
    )
    unregisterSpy.mockClear()

    rerender(<MultiProbe optionsArray={[{ name: "a", callback: vi.fn() }]} />)

    // The removed element should be unregistered
    expect(unregisterSpy).toHaveBeenCalled()
  })

  it("patches options without unregistering", () => {
    const { rerender } = render(<MultiProbe optionsArray={[{ name: "a", callback: vi.fn() }]} />)
    registerSpy.mockClear()
    unregisterSpy.mockClear()

    rerender(<MultiProbe optionsArray={[{ name: "b", callback: vi.fn() }]} />)

    expect(updateElementOptionsSpy).toHaveBeenCalled()
    const lastCall =
      updateElementOptionsSpy.mock.calls[updateElementOptionsSpy.mock.calls.length - 1]
    expect(lastCall?.[1].name).toBe("b")
    expect(unregisterSpy).not.toHaveBeenCalled()
  })

  it("works with an empty array", () => {
    const { container } = render(<MultiProbe optionsArray={[]} />)
    expect(registerSpy).not.toHaveBeenCalled()
    expect(container.querySelectorAll("button")).toHaveLength(0)
  })

  it("registers three elements", () => {
    render(
      <MultiProbe
        optionsArray={[
          { name: "x", callback: vi.fn() },
          { name: "y", callback: vi.fn() },
          { name: "z", callback: vi.fn() },
        ]}
      />
    )
    expect(registerSpy).toHaveBeenCalledTimes(3)
    expect(registerSpy.mock.calls[0][0].name).toBe("x")
    expect(registerSpy.mock.calls[1][0].name).toBe("y")
    expect(registerSpy.mock.calls[2][0].name).toBe("z")
  })

  describe("enabled option", () => {
    it("registers every slot, carrying each slot's enabled flag", () => {
      render(
        <MultiProbe
          optionsArray={[
            { name: "a", callback: vi.fn(), enabled: true },
            { name: "b", callback: vi.fn(), enabled: false },
            { name: "c", callback: vi.fn() },
          ]}
        />
      )
      expect(registerSpy).toHaveBeenCalledTimes(3)
      const byName = Object.fromEntries(registerSpy.mock.calls.map(c => [c[0].name, c[0].enabled]))
      expect(byName).toEqual({ a: true, b: false, c: undefined })
    })

    it("patches a slot's enabled (false → true) without re-registering", () => {
      const { rerender } = render(
        <MultiProbe optionsArray={[{ name: "a", callback: vi.fn(), enabled: false }]} />
      )
      expect(registerSpy).toHaveBeenCalledTimes(1)

      rerender(<MultiProbe optionsArray={[{ name: "a", callback: vi.fn(), enabled: true }]} />)
      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(updateElementOptionsSpy.mock.calls.at(-1)?.[1].enabled).toBe(true)
    })

    it("patches a slot's enabled (true → false) without unregistering", () => {
      const { rerender } = render(
        <MultiProbe optionsArray={[{ name: "a", callback: vi.fn(), enabled: true }]} />
      )
      expect(registerSpy).toHaveBeenCalledTimes(1)

      rerender(<MultiProbe optionsArray={[{ name: "a", callback: vi.fn(), enabled: false }]} />)
      expect(unregisterSpy).not.toHaveBeenCalled()
      expect(updateElementOptionsSpy.mock.calls.at(-1)?.[1].enabled).toBe(false)
    })

    it("patches slots independently", () => {
      const { rerender } = render(
        <MultiProbe
          optionsArray={[
            { name: "a", callback: vi.fn(), enabled: true },
            { name: "b", callback: vi.fn(), enabled: true },
          ]}
        />
      )
      expect(registerSpy).toHaveBeenCalledTimes(2)
      updateElementOptionsSpy.mockClear()

      // Disable only slot "b"
      rerender(
        <MultiProbe
          optionsArray={[
            { name: "a", callback: vi.fn(), enabled: true },
            { name: "b", callback: vi.fn(), enabled: false },
          ]}
        />
      )

      expect(unregisterSpy).not.toHaveBeenCalled()
      const enabledByName = Object.fromEntries(
        updateElementOptionsSpy.mock.calls.map(c => [c[1].name, c[1].enabled])
      )
      expect(enabledByName.b).toBe(false)
    })
  })

  describe("meta option", () => {
    it("patches when only an item's meta content changes", () => {
      const cb = vi.fn()
      const { rerender } = render(
        <MultiProbe optionsArray={[{ name: "a", callback: cb, meta: { v: 1 } }]} />
      )
      updateElementOptionsSpy.mockClear()

      rerender(<MultiProbe optionsArray={[{ name: "a", callback: cb, meta: { v: 2 } }]} />)

      const metaCalls = updateElementOptionsSpy.mock.calls.filter(
        c => (c[1].meta as { v?: number } | undefined)?.v === 2
      )
      expect(metaCalls.length).toBeGreaterThan(0)
    })

    it("does not re-patch when meta content is unchanged across renders", () => {
      const cb = vi.fn()
      const { rerender } = render(
        <MultiProbe optionsArray={[{ name: "a", callback: cb, meta: { v: 1 } }]} />
      )
      updateElementOptionsSpy.mockClear()

      // New object, identical content - must not trigger a patch.
      rerender(<MultiProbe optionsArray={[{ name: "a", callback: cb, meta: { v: 1 } }]} />)

      expect(updateElementOptionsSpy).not.toHaveBeenCalled()
    })
  })
})
