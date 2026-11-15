import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { page } from "vitest/browser"
import {
  createPositionObserver,
  type PositionEntry,
  type PositionObserver,
} from "./createPositionObserver"

let observer: PositionObserver
let entries: PositionEntry[]

const latestFor = (element: Element) => entries.filter(entry => entry.target === element).pop()

const createBox = (
  style: Partial<CSSStyleDeclaration> = {},
  parent: HTMLElement = document.body
) => {
  const element = document.createElement("div")
  Object.assign(element.style, {
    position: "absolute",
    top: "100px",
    left: "100px",
    width: "100px",
    height: "50px",
    ...style,
  })
  parent.append(element)

  return element
}

const observe = (element: Element) => {
  observer.observe(element)

  return expect.poll(() => latestFor(element)).toBeDefined()
}

const expectReported = (element: Element, isIntersecting = true) =>
  expect
    .poll(() => {
      const entry = latestFor(element)

      return (
        entry && { rect: entry.boundingClientRect.toJSON(), isIntersecting: entry.isIntersecting }
      )
    })
    .toEqual({ rect: element.getBoundingClientRect().toJSON(), isIntersecting })

const waitFrames = async (count = 5) => {
  for (let i = 0; i < count; i++) {
    await new Promise(requestAnimationFrame)
  }
}

beforeEach(async () => {
  await page.viewport(800, 600)
  document.body.style.margin = "0"
  document.body.style.height = "3000px"
  entries = []
  observer = createPositionObserver(batch => entries.push(...batch))
})

afterEach(() => {
  observer.disconnect()
  document.body.innerHTML = ""
  window.scrollTo(0, 0)
})

describe("createPositionObserver", () => {
  it("reports the initial rect of a visible element", async () => {
    const box = createBox()
    observer.observe(box)

    await expectReported(box)
  })

  it("reports an element outside the viewport as not intersecting", async () => {
    const box = createBox({ top: "2000px" })
    observer.observe(box)

    await expectReported(box, false)
  })

  it("does not report again while nothing moves", async () => {
    const box = createBox()
    await observe(box)
    await waitFrames(10)

    expect(entries).toHaveLength(1)
  })

  it("reports a 2px window scroll in both directions", async () => {
    const box = createBox({ top: "300px" })
    await observe(box)

    window.scrollTo(0, 2)
    await expectReported(box)

    window.scrollTo(0, 0)
    await expectReported(box)
  })

  it("reports a larger window scroll", async () => {
    const box = createBox({ top: "300px" })
    await observe(box)

    window.scrollTo(0, 250)
    await expectReported(box)
  })

  it("reports layout shifts without scrolling", async () => {
    const box = createBox()
    await observe(box)

    box.style.top = "140px"
    await expectReported(box)

    box.style.left = "60px"
    await expectReported(box)
  })

  it("reports transforms", async () => {
    const box = createBox()
    await observe(box)

    box.style.transform = "translate(30px, -20px)"
    await expectReported(box)
  })

  it("reports size changes", async () => {
    const box = createBox()
    await observe(box)

    box.style.width = "180px"
    await expectReported(box)

    box.style.height = "20px"
    await expectReported(box)
  })

  it("reports leaving and re-entering the viewport", async () => {
    const box = createBox({ top: "300px" })
    await observe(box)

    window.scrollTo(0, 1000)
    await expectReported(box, false)

    window.scrollTo(0, 100)
    await expectReported(box)
  })

  it("reports 2px scrolls of an element partially clipped by a scroll container", async () => {
    const container = createBox({
      top: "50px",
      left: "50px",
      width: "300px",
      height: "100px",
      overflow: "auto",
    })
    const content = createBox(
      { position: "relative", top: "0", left: "0", height: "1000px" },
      container
    )
    const box = createBox({ top: "80px", left: "20px" }, content)
    await observe(box)

    container.scrollTop = 2
    await expectReported(box)

    container.scrollTop = 0
    await expectReported(box)

    container.scrollTop = 500
    await expectReported(box, false)
  })

  it("reports position changes caused by a viewport resize", async () => {
    const box = createBox({ left: "auto", right: "0" })
    await observe(box)

    await page.viewport(600, 600)
    await expectReported(box)
  })

  it("stops reporting after unobserve", async () => {
    const box = createBox()
    await observe(box)

    observer.unobserve(box)
    box.style.top = "200px"
    await waitFrames(10)

    expect(entries).toHaveLength(1)
  })
})
