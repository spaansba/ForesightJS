import { act, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { createUnregisteredSnapshot } from "js.foresight"
import { mockState, registerSpy, updateElementOptionsSpy, unregisterSpy } from "../tests/setup"
import { Foresight } from "./Foresight"

type Item = { id: string; label: string }

const List = ({ items }: { items: Item[] }) => (
  <div>
    {items.map(item => (
      <Foresight<HTMLButtonElement> key={item.id} foresightName={item.label} callback={vi.fn()}>
        {({ elementRef, isPredicted }) => (
          <button data-testid={`el-${item.id}`} data-predicted={isPredicted} ref={elementRef}>
            {item.label}
          </button>
        )}
      </Foresight>
    ))}
  </div>
)

describe("Foresight", () => {
  it("registers when the ref attaches and passes state to children", () => {
    const { getByTestId } = render(<List items={[{ id: "1", label: "a" }]} />)

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy.mock.calls[0][0].name).toBe("a")
    expect(registerSpy.mock.calls[0][0].element).toBeInstanceOf(HTMLButtonElement)
    expect(getByTestId("el-1").getAttribute("data-predicted")).toBe("false")
  })

  it("unregisters on unmount", () => {
    const { unmount } = render(<List items={[{ id: "1", label: "a" }]} />)
    unmount()
    expect(unregisterSpy).toHaveBeenCalledTimes(1)
  })

  it("only registers the new item when the list grows", () => {
    const { rerender } = render(<List items={[{ id: "1", label: "a" }]} />)
    registerSpy.mockClear()
    unregisterSpy.mockClear()

    rerender(
      <List
        items={[
          { id: "1", label: "a" },
          { id: "2", label: "b" },
        ]}
      />
    )

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy.mock.calls[0][0].name).toBe("b")
    expect(unregisterSpy).not.toHaveBeenCalled()
  })

  it("reflects state updates pushed through subscribe", async () => {
    const { getByTestId } = render(<List items={[{ id: "1", label: "a" }]} />)
    expect(getByTestId("el-1").getAttribute("data-predicted")).toBe("false")

    await act(async () => {
      mockState.currentSnapshot = { ...createUnregisteredSnapshot(false), isPredicted: true }
      mockState.listeners.forEach(l => l())
    })

    expect(getByTestId("el-1").getAttribute("data-predicted")).toBe("true")
  })

  it("patches option changes without re-registering", () => {
    const { rerender } = render(<List items={[{ id: "1", label: "a" }]} />)
    registerSpy.mockClear()
    unregisterSpy.mockClear()

    rerender(<List items={[{ id: "1", label: "renamed" }]} />)

    expect(registerSpy).not.toHaveBeenCalled()
    expect(unregisterSpy).not.toHaveBeenCalled()
    expect(updateElementOptionsSpy.mock.calls.at(-1)?.[1].name).toBe("renamed")
  })

  describe("as form", () => {
    it("renders the tag itself and registers it", () => {
      const { getByTestId } = render(
        <Foresight as="button" data-testid="btn" foresightName="checkout" callback={vi.fn()}>
          Checkout
        </Foresight>
      )

      const button = getByTestId("btn")
      expect(button.tagName).toBe("BUTTON")
      expect(button.textContent).toBe("Checkout")
      expect(registerSpy).toHaveBeenCalledTimes(1)
      expect(registerSpy.mock.calls[0][0].name).toBe("checkout")
      expect(registerSpy.mock.calls[0][0].element).toBe(button)
    })

    it("forwards DOM props (incl. name) and keeps foresight options out of the DOM", () => {
      const onClick = vi.fn()
      const { getByTestId } = render(
        <Foresight
          as="button"
          data-testid="btn"
          className="checkout"
          onClick={onClick}
          name="dom-name"
          foresightName="checkout"
          hitSlop={20}
          callback={vi.fn()}
        >
          Checkout
        </Foresight>
      )

      const button = getByTestId("btn")
      expect(button.className).toBe("checkout")
      expect(button.getAttribute("name")).toBe("dom-name")
      expect(button.hasAttribute("foresightname")).toBe(false)
      expect(button.hasAttribute("hitslop")).toBe(false)
      button.click()
      expect(onClick).toHaveBeenCalled()
      expect(registerSpy.mock.calls[0][0].name).toBe("checkout")
      expect(registerSpy.mock.calls[0][0].hitSlop).toBe(20)
    })

    it("passes state to function children", async () => {
      const { getByTestId } = render(
        <Foresight as="button" data-testid="btn" callback={vi.fn()}>
          {({ isPredicted }) => <span>{isPredicted ? "hot" : "cold"}</span>}
        </Foresight>
      )
      expect(getByTestId("btn").textContent).toBe("cold")

      await act(async () => {
        mockState.currentSnapshot = { ...createUnregisteredSnapshot(false), isPredicted: true }
        mockState.listeners.forEach(l => l())
      })

      expect(getByTestId("btn").textContent).toBe("hot")
    })

    it("resolves a function className from state", async () => {
      const { getByTestId } = render(
        <Foresight
          as="button"
          data-testid="btn"
          className={({ isPredicted }) => (isPredicted ? "hot" : "cold")}
          callback={vi.fn()}
        >
          Checkout
        </Foresight>
      )
      expect(getByTestId("btn").className).toBe("cold")

      await act(async () => {
        mockState.currentSnapshot = { ...createUnregisteredSnapshot(false), isPredicted: true }
        mockState.listeners.forEach(l => l())
      })

      expect(getByTestId("btn").className).toBe("hot")
    })

    it("resolves a function style from state", async () => {
      const { getByTestId } = render(
        <Foresight
          as="button"
          data-testid="btn"
          style={({ isPredicted }) => ({ opacity: isPredicted ? 1 : 0.5 })}
          callback={vi.fn()}
        >
          Checkout
        </Foresight>
      )
      expect(getByTestId("btn").style.opacity).toBe("0.5")

      await act(async () => {
        mockState.currentSnapshot = { ...createUnregisteredSnapshot(false), isPredicted: true }
        mockState.listeners.forEach(l => l())
      })

      expect(getByTestId("btn").style.opacity).toBe("1")
    })

    it("does not subscribe to render state when children, className and style are static", () => {
      render(
        <Foresight as="button" data-testid="btn" callback={vi.fn()}>
          Checkout
        </Foresight>
      )

      // Only the data-attribute mirror subscribes (it mutates the DOM
      // directly) - useForesightState must not add a second subscription.
      expect(mockState.listeners).toHaveLength(1)
    })

    it("mirrors state onto data-* attributes", async () => {
      const { getByTestId } = render(
        <Foresight as="button" data-testid="btn" callback={vi.fn()}>
          Checkout
        </Foresight>
      )

      const button = getByTestId("btn")
      expect(button.hasAttribute("data-predicted")).toBe(false)
      expect(button.hasAttribute("data-callback-running")).toBe(false)
      expect(button.hasAttribute("data-status")).toBe(false)

      await act(async () => {
        mockState.currentSnapshot = {
          ...createUnregisteredSnapshot(false),
          isPredicted: true,
          isCallbackRunning: true,
          status: "success",
        }
        mockState.listeners.forEach(l => l())
      })

      expect(button.hasAttribute("data-predicted")).toBe(true)
      expect(button.hasAttribute("data-callback-running")).toBe(true)
      expect(button.getAttribute("data-status")).toBe("success")
    })

    it("does not set data-* attributes in the render-prop form", async () => {
      const { getByTestId } = render(
        <Foresight<HTMLButtonElement> callback={vi.fn()}>
          {({ elementRef }) => <button data-testid="btn" ref={elementRef} />}
        </Foresight>
      )

      await act(async () => {
        mockState.currentSnapshot = { ...createUnregisteredSnapshot(false), isPredicted: true }
        mockState.listeners.forEach(l => l())
      })

      expect(getByTestId("btn").hasAttribute("data-predicted")).toBe(false)
    })

    it("unregisters on unmount", () => {
      const { unmount } = render(
        <Foresight as="div" callback={vi.fn()}>
          content
        </Foresight>
      )
      unmount()
      expect(unregisterSpy).toHaveBeenCalledTimes(1)
    })
  })
})
