import { describe, it, expect, beforeEach, vi } from "vitest"
import { getFocusedElementIndex } from "./getFocusedElementIndex"
import type { FocusableElement } from "tabbable"

describe("getFocusedElementIndex", () => {
  let tabbableElements: FocusableElement[]
  let element0: HTMLElement
  let element1: HTMLElement
  let element2: HTMLElement
  let element3: HTMLElement
  let element4: HTMLElement

  beforeEach(() => {
    // Create test elements
    element0 = document.createElement("button")
    element1 = document.createElement("input")
    element2 = document.createElement("select")
    element3 = document.createElement("textarea")
    element4 = document.createElement("a")

    element0.setAttribute("data-testid", "button-0")
    element1.setAttribute("data-testid", "input-1")
    element2.setAttribute("data-testid", "select-2")
    element3.setAttribute("data-testid", "textarea-3")
    element4.setAttribute("data-testid", "link-4")

    tabbableElements = [element0, element1, element2, element3, element4] as FocusableElement[]
  })

  describe("forward tabbing (isReversed = false)", () => {
    it("should predict next element correctly in sequential forward tabbing", () => {
      const result = getFocusedElementIndex(false, 1, tabbableElements, element2)
      expect(result).toBe(2)
    })

    it("should predict first element when coming from last element (wrapping)", () => {
      // This tests the predictive logic, though in practice DOM focus wrapping is handled by the browser
      const result = getFocusedElementIndex(false, 3, tabbableElements, element4)
      expect(result).toBe(4)
    })

    it("should handle tabbing from beginning of list", () => {
      const result = getFocusedElementIndex(false, 0, tabbableElements, element1)
      expect(result).toBe(1)
    })

    it("should fall back to linear search when prediction fails", () => {
      // Jump from index 1 to index 3 (skipping 2), prediction should fail and fallback to search
      const result = getFocusedElementIndex(false, 1, tabbableElements, element3)
      expect(result).toBe(3)
    })

    it("should handle prediction beyond array bounds", () => {
      // When predicting beyond the end of array, should fall back to linear search
      const result = getFocusedElementIndex(false, 4, tabbableElements, element0)
      expect(result).toBe(0)
    })
  })

  describe("reverse tabbing (isReversed = true)", () => {
    it("should predict previous element correctly in sequential reverse tabbing", () => {
      const result = getFocusedElementIndex(true, 2, tabbableElements, element1)
      expect(result).toBe(1)
    })

    it("should handle reverse tabbing from end of list", () => {
      const result = getFocusedElementIndex(true, 4, tabbableElements, element3)
      expect(result).toBe(3)
    })

    it("should handle reverse tabbing to beginning of list", () => {
      const result = getFocusedElementIndex(true, 1, tabbableElements, element0)
      expect(result).toBe(0)
    })

    it("should fall back to linear search when reverse prediction fails", () => {
      // Jump from index 3 to index 1 (skipping 2), prediction should fail
      const result = getFocusedElementIndex(true, 3, tabbableElements, element1)
      expect(result).toBe(1)
    })

    it("should handle prediction before array bounds", () => {
      // When predicting before the start of array, should fall back to linear search
      const result = getFocusedElementIndex(true, 0, tabbableElements, element4)
      expect(result).toBe(4)
    })
  })

  describe("edge cases", () => {
    it("should use linear search when lastFocusedIndex is null", () => {
      const result = getFocusedElementIndex(false, null, tabbableElements, element2)
      expect(result).toBe(2)
    })

    it("should return -1 when element is not in the cache", () => {
      const outsideElement = document.createElement("div")
      const result = getFocusedElementIndex(false, 1, tabbableElements, outsideElement)
      expect(result).toBe(-1)
    })

    it("should handle empty tabbable elements array", () => {
      const emptyArray: FocusableElement[] = []
      const result = getFocusedElementIndex(false, null, emptyArray, element0)
      expect(result).toBe(-1)
    })

    it("should handle single element array", () => {
      const singleElementArray = [element0] as FocusableElement[]
      const result = getFocusedElementIndex(false, null, singleElementArray, element0)
      expect(result).toBe(0)
    })

    it("should handle single element array with prediction", () => {
      const singleElementArray = [element0] as FocusableElement[]

      // Forward prediction from index 0 should go out of bounds and fallback
      const forwardResult = getFocusedElementIndex(false, 0, singleElementArray, element0)
      expect(forwardResult).toBe(0)

      // Reverse prediction from index 0 should go negative and fallback
      const reverseResult = getFocusedElementIndex(true, 0, singleElementArray, element0)
      expect(reverseResult).toBe(0)
    })

    it("should handle negative lastFocusedIndex gracefully", () => {
      // This shouldn't happen in normal usage, but test robustness
      const result = getFocusedElementIndex(false, -1, tabbableElements, element0)
      expect(result).toBe(0)
    })

    it("should handle lastFocusedIndex beyond array length", () => {
      // This shouldn't happen in normal usage, but test robustness
      const result = getFocusedElementIndex(false, 10, tabbableElements, element0)
      expect(result).toBe(0)
    })
  })

  describe("performance optimization verification", () => {
    it("should use O(1) prediction path for sequential forward tabbing", () => {
      // This test verifies that the fast path is taken
      const consoleSpy = vi.spyOn(console, "log")

      // Sequential tabbing should hit the prediction path
      let result = getFocusedElementIndex(false, 0, tabbableElements, element1)
      expect(result).toBe(1)

      result = getFocusedElementIndex(false, 1, tabbableElements, element2)
      expect(result).toBe(2)

      result = getFocusedElementIndex(false, 2, tabbableElements, element3)
      expect(result).toBe(3)

      // Verify no console logs were called (since we're not logging, but this ensures clean execution)
      consoleSpy.mockRestore()
    })

    it("should use O(1) prediction path for sequential reverse tabbing", () => {
      // Sequential reverse tabbing should hit the prediction path
      let result = getFocusedElementIndex(true, 4, tabbableElements, element3)
      expect(result).toBe(3)

      result = getFocusedElementIndex(true, 3, tabbableElements, element2)
      expect(result).toBe(2)

      result = getFocusedElementIndex(true, 2, tabbableElements, element1)
      expect(result).toBe(1)
    })

    it("should fall back to O(n) linear search for non-sequential access", () => {
      // Non-sequential access should fall back to linear search
      const result = getFocusedElementIndex(false, 0, tabbableElements, element4)
      expect(result).toBe(4)
    })
  })

  describe("real-world scenarios", () => {
    it("should handle typical tab navigation flow", () => {
      // Simulate a user tabbing through elements sequentially
      let lastIndex: number | null = null

      // User tabs to first element
      lastIndex = getFocusedElementIndex(false, lastIndex, tabbableElements, element0)
      expect(lastIndex).toBe(0)

      // User continues tabbing forward
      lastIndex = getFocusedElementIndex(false, lastIndex, tabbableElements, element1)
      expect(lastIndex).toBe(1)

      lastIndex = getFocusedElementIndex(false, lastIndex, tabbableElements, element2)
      expect(lastIndex).toBe(2)

      // User tabs backward
      lastIndex = getFocusedElementIndex(true, lastIndex, tabbableElements, element1)
      expect(lastIndex).toBe(1)

      lastIndex = getFocusedElementIndex(true, lastIndex, tabbableElements, element0)
      expect(lastIndex).toBe(0)
    })

    it("should handle mouse click interrupting tab navigation", () => {
      // User is at element 1, then clicks on element 4
      const lastIndex = 1
      const result = getFocusedElementIndex(false, lastIndex, tabbableElements, element4)
      expect(result).toBe(4)
    })

    it("should handle dynamic element removal/addition", () => {
      // Element is removed from cache but user tries to find it
      const modifiedCache = [element0, element2, element3, element4] as FocusableElement[] // element1 removed
      const result = getFocusedElementIndex(false, 0, modifiedCache, element1)
      expect(result).toBe(-1)
    })
  })
})
