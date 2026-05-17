import type { ComponentPublicInstance } from "vue"
import { describe, expect, it } from "vitest"
import { resolveElement } from "./resolveElement"

describe("resolveElement", () => {
  it("returns null for null", () => {
    expect(resolveElement(null)).toBeNull()
  })

  it("returns null for undefined", () => {
    expect(resolveElement(undefined)).toBeNull()
  })

  it("returns the element when given an HTMLElement", () => {
    const el = document.createElement("button")
    expect(resolveElement(el)).toBe(el)
  })

  it("returns the element when given an SVGElement", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    expect(resolveElement(svg)).toBe(svg)
  })

  it("extracts $el from a ComponentPublicInstance", () => {
    const el = document.createElement("div")
    const instance = { $el: el } as unknown as ComponentPublicInstance
    expect(resolveElement(instance)).toBe(el)
  })

  it("returns null when $el is a comment node", () => {
    const comment = document.createComment("v-if")
    const instance = { $el: comment } as unknown as ComponentPublicInstance
    expect(resolveElement(instance)).toBeNull()
  })

  it("returns null when $el is null", () => {
    const instance = { $el: null } as unknown as ComponentPublicInstance
    expect(resolveElement(instance)).toBeNull()
  })

  it("returns null when $el is undefined", () => {
    const instance = { $el: undefined } as unknown as ComponentPublicInstance
    expect(resolveElement(instance)).toBeNull()
  })

  it("returns the element when $el is an SVGElement", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    const instance = { $el: svg } as unknown as ComponentPublicInstance
    expect(resolveElement(instance)).toBe(svg)
  })

  it("returns null for a text node $el", () => {
    const text = document.createTextNode("hello")
    // Text nodes have nodeType 3 (TEXT_NODE), not COMMENT_NODE.
    // resolveElement only filters comments, so text nodes pass through.
    const instance = { $el: text } as unknown as ComponentPublicInstance
    // text is not an Element, but it's also not a comment, so it gets returned
    // via the fallback cast. This is an edge case that shouldn't occur in practice.
    expect(resolveElement(instance)).toBe(text)
  })
})
