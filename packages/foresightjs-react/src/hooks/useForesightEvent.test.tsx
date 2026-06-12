import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { ForesightEvent, ForesightEventMap } from "js.foresight"
import { addEventListenerSpy } from "../tests/setup"
import { useForesightEvent } from "./useForesightEvent"

type ProbeProps<K extends ForesightEvent> = {
  eventType: K
  listener: (event: ForesightEventMap[K]) => void
}

const Probe = <K extends ForesightEvent>({ eventType, listener }: ProbeProps<K>) => {
  useForesightEvent(eventType, listener)

  return <span data-testid="probe" />
}

describe("useForesightEvent", () => {
  it("subscribes to the event on mount", () => {
    const listener = vi.fn()
    render(<Probe eventType="callbackCompleted" listener={listener} />)

    expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
    expect(addEventListenerSpy).toHaveBeenCalledWith("callbackCompleted", expect.any(Function), {
      signal: expect.any(AbortSignal),
    })
  })

  it("aborts the signal on unmount", () => {
    const listener = vi.fn()
    const { unmount } = render(<Probe eventType="callbackCompleted" listener={listener} />)

    const signal = addEventListenerSpy.mock.calls[0]![2]!.signal as AbortSignal
    expect(signal.aborted).toBe(false)

    unmount()

    expect(signal.aborted).toBe(true)
  })

  it("forwards events to the listener", () => {
    const listener = vi.fn()
    render(<Probe eventType="callbackCompleted" listener={listener} />)

    const registeredListener = addEventListenerSpy.mock.calls[0][1]
    const fakeEvent = { type: "callbackCompleted", timestamp: 1 }

    registeredListener(fakeEvent)

    expect(listener).toHaveBeenCalledWith(fakeEvent)
  })

  it("always calls the latest listener (no stale closure)", () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    const { rerender } = render(<Probe eventType="callbackCompleted" listener={listener1} />)
    rerender(<Probe eventType="callbackCompleted" listener={listener2} />)

    const registeredListener = addEventListenerSpy.mock.calls[0][1]
    const fakeEvent = { type: "callbackCompleted", timestamp: 1 }
    registeredListener(fakeEvent)

    expect(listener1).not.toHaveBeenCalled()
    expect(listener2).toHaveBeenCalledWith(fakeEvent)
  })

  it("does not re-subscribe when only the listener reference changes", () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    const { rerender } = render(<Probe eventType="callbackCompleted" listener={listener1} />)
    rerender(<Probe eventType="callbackCompleted" listener={listener2} />)

    expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
  })

  it("re-subscribes when the event type changes", () => {
    const listener = vi.fn()

    const { rerender } = render(<Probe eventType="callbackCompleted" listener={listener} />)

    const firstSignal = addEventListenerSpy.mock.calls[0]![2]!.signal as AbortSignal
    addEventListenerSpy.mockClear()

    rerender(<Probe eventType="elementRegistered" listener={listener} />)

    expect(firstSignal.aborted).toBe(true)
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
    expect(addEventListenerSpy).toHaveBeenCalledWith("elementRegistered", expect.any(Function), {
      signal: expect.any(AbortSignal),
    })
  })
})
