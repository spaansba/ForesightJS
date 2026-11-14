import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { ForesightManager } from "js.foresight"
import { Foresight, useForesight } from "./index"

const { registeredElements } = ForesightManager.instance

const Link = ({ name }: { name: string }) => {
  const {
    elementRef,
    isRegistered,
    name: stateName,
  } = useForesight<HTMLAnchorElement>({
    callback: () => {},
    name,
  })

  return <a ref={elementRef}>{`${isRegistered}:${stateName}`}</a>
}

describe("against the real ForesightManager", () => {
  it("useForesight registers, mirrors core state, patches options and unregisters", () => {
    const { container, rerender, unmount } = render(<Link name="first" />)
    const element = container.querySelector("a")!
    expect(registeredElements.has(element)).toBe(true)
    expect(element.textContent).toBe("true:first")

    rerender(<Link name="second" />)
    expect(registeredElements.get(element)?.name).toBe("second")
    expect(element.textContent).toBe("true:second")

    unmount()
    expect(registeredElements.has(element)).toBe(false)
  })

  it("keeps one meta identity in the manager for inline nested meta", () => {
    const InlineMeta = ({ id }: { id: number }) => {
      const { elementRef } = useForesight<HTMLButtonElement>({
        callback: () => {},
        meta: { route: { id } },
      })

      return <button ref={elementRef} />
    }

    const { container, rerender, unmount } = render(<InlineMeta id={1} />)
    const element = container.querySelector("button")!
    const meta = registeredElements.get(element)?.meta

    rerender(<InlineMeta id={1} />)
    expect(registeredElements.get(element)?.meta).toBe(meta)

    rerender(<InlineMeta id={2} />)
    expect(registeredElements.get(element)?.meta).toEqual({ route: { id: 2 } })
    unmount()
  })

  it("does not loop on an inline function inside meta", () => {
    const InlineFunctionMeta = () => {
      const { elementRef, isRegistered } = useForesight<HTMLButtonElement>({
        callback: () => {},
        meta: { track: () => {} },
      })

      return <button ref={elementRef}>{String(isRegistered)}</button>
    }

    const { container, unmount } = render(<InlineFunctionMeta />)
    expect(container.textContent).toBe("true")
    unmount()
  })

  it("does not loop on an inline Map inside meta", () => {
    const InlineMapMeta = () => {
      const { elementRef, isRegistered } = useForesight<HTMLButtonElement>({
        callback: () => {},
        meta: { map: new Map([[1, 2]]) },
      })

      return <button ref={elementRef}>{String(isRegistered)}</button>
    }

    const { container, unmount } = render(<InlineMapMeta />)
    expect(container.textContent).toBe("true")
    unmount()
  })

  it("Foresight `as` registers the rendered element and exposes its state", () => {
    const { container, unmount } = render(
      <Foresight as="button" callback={() => {}} foresightName="cta">
        {state => state.name}
      </Foresight>
    )
    const element = container.querySelector("button")!
    expect(registeredElements.get(element)?.name).toBe("cta")
    expect(element.textContent).toBe("cta")

    unmount()
    expect(registeredElements.has(element)).toBe(false)
  })
})
