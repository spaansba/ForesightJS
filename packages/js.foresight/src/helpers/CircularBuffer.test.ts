import { describe, it, expect } from "vitest"
import { CircularBuffer } from "./CircularBuffer"

describe("CircularBuffer", () => {
  describe("constructor", () => {
    it("should create a buffer with specified capacity", () => {
      const buffer = new CircularBuffer<number>(5)
      expect(buffer.size).toBe(5)
      expect(buffer.length).toBe(0)
      expect(buffer.isEmpty).toBe(true)
      expect(buffer.isFull).toBe(false)
    })

    it("should throw error for invalid capacity", () => {
      expect(() => new CircularBuffer(0)).toThrow("CircularBuffer capacity must be greater than 0")
      expect(() => new CircularBuffer(-1)).toThrow("CircularBuffer capacity must be greater than 0")
    })
  })

  describe("add", () => {
    it("should add items to empty buffer", () => {
      const buffer = new CircularBuffer<string>(3)
      
      buffer.add("first")
      expect(buffer.length).toBe(1)
      expect(buffer.getItems()).toEqual(["first"])
      
      buffer.add("second")
      expect(buffer.length).toBe(2)
      expect(buffer.getItems()).toEqual(["first", "second"])
    })

    it("should fill buffer to capacity", () => {
      const buffer = new CircularBuffer<number>(3)
      
      buffer.add(1)
      buffer.add(2)
      buffer.add(3)
      
      expect(buffer.length).toBe(3)
      expect(buffer.isFull).toBe(true)
      expect(buffer.getItems()).toEqual([1, 2, 3])
    })

    it("should overwrite oldest items when buffer is full", () => {
      const buffer = new CircularBuffer<number>(3)
      
      buffer.add(1)
      buffer.add(2)
      buffer.add(3)
      buffer.add(4)
      
      expect(buffer.length).toBe(3)
      expect(buffer.getItems()).toEqual([2, 3, 4])
      
      buffer.add(5)
      expect(buffer.getItems()).toEqual([3, 4, 5])
    })

    it("should maintain chronological order when wrapping", () => {
      const buffer = new CircularBuffer<string>(2)
      
      buffer.add("a")
      buffer.add("b")
      buffer.add("c")
      buffer.add("d")
      
      expect(buffer.getItems()).toEqual(["c", "d"])
    })
  })

  describe("getItems", () => {
    it("should return empty array for empty buffer", () => {
      const buffer = new CircularBuffer<number>(5)
      expect(buffer.getItems()).toEqual([])
    })

    it("should return items in chronological order (oldest first)", () => {
      const buffer = new CircularBuffer<number>(4)
      
      buffer.add(10)
      buffer.add(20)
      buffer.add(30)
      
      expect(buffer.getItems()).toEqual([10, 20, 30])
    })

    it("should return items in correct order after wrapping", () => {
      const buffer = new CircularBuffer<number>(3)
      
      buffer.add(1)
      buffer.add(2)
      buffer.add(3)
      buffer.add(4)
      buffer.add(5)
      
      expect(buffer.getItems()).toEqual([3, 4, 5])
    })
  })

  describe("resize", () => {
    it("should handle resizing to larger capacity", () => {
      const buffer = new CircularBuffer<number>(2)
      buffer.add(1)
      buffer.add(2)
      
      buffer.resize(4)
      
      expect(buffer.size).toBe(4)
      expect(buffer.length).toBe(2)
      expect(buffer.getItems()).toEqual([1, 2])
      
      buffer.add(3)
      buffer.add(4)
      expect(buffer.getItems()).toEqual([1, 2, 3, 4])
    })

    it("should handle resizing to smaller capacity", () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.add(1)
      buffer.add(2)
      buffer.add(3)
      buffer.add(4)
      buffer.add(5)
      
      buffer.resize(3)
      
      expect(buffer.size).toBe(3)
      expect(buffer.length).toBe(3)
      expect(buffer.getItems()).toEqual([3, 4, 5])
    })

    it("should handle resizing to same capacity", () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.add(1)
      buffer.add(2)
      
      buffer.resize(3)
      
      expect(buffer.size).toBe(3)
      expect(buffer.length).toBe(2)
      expect(buffer.getItems()).toEqual([1, 2])
    })

    it("should handle resizing with wrapped buffer", () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.add(1)
      buffer.add(2)
      buffer.add(3)
      buffer.add(4)
      
      expect(buffer.getItems()).toEqual([2, 3, 4])
      
      buffer.resize(2)
      
      expect(buffer.size).toBe(2)
      expect(buffer.length).toBe(2)
      expect(buffer.getItems()).toEqual([3, 4])
    })

    it("should throw error for invalid capacity", () => {
      const buffer = new CircularBuffer<number>(3)
      expect(() => buffer.resize(0)).toThrow("CircularBuffer capacity must be greater than 0")
      expect(() => buffer.resize(-1)).toThrow("CircularBuffer capacity must be greater than 0")
    })
  })

  describe("clear", () => {
    it("should clear empty buffer", () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.clear()
      
      expect(buffer.length).toBe(0)
      expect(buffer.isEmpty).toBe(true)
      expect(buffer.getItems()).toEqual([])
    })

    it("should clear partially filled buffer", () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.add(1)
      buffer.add(2)
      
      buffer.clear()
      
      expect(buffer.length).toBe(0)
      expect(buffer.isEmpty).toBe(true)
      expect(buffer.getItems()).toEqual([])
    })

    it("should clear full buffer", () => {
      const buffer = new CircularBuffer<number>(2)
      buffer.add(1)
      buffer.add(2)
      buffer.add(3)
      
      expect(buffer.isFull).toBe(true)
      
      buffer.clear()
      
      expect(buffer.length).toBe(0)
      expect(buffer.isEmpty).toBe(true)
      expect(buffer.isFull).toBe(false)
      expect(buffer.getItems()).toEqual([])
    })
  })

  describe("properties", () => {
    it("should track length correctly", () => {
      const buffer = new CircularBuffer<number>(3)
      
      expect(buffer.length).toBe(0)
      
      buffer.add(1)
      expect(buffer.length).toBe(1)
      
      buffer.add(2)
      expect(buffer.length).toBe(2)
      
      buffer.add(3)
      expect(buffer.length).toBe(3)
      
      buffer.add(4)
      expect(buffer.length).toBe(3)
    })

    it("should track isEmpty correctly", () => {
      const buffer = new CircularBuffer<number>(2)
      
      expect(buffer.isEmpty).toBe(true)
      
      buffer.add(1)
      expect(buffer.isEmpty).toBe(false)
      
      buffer.clear()
      expect(buffer.isEmpty).toBe(true)
    })

    it("should track isFull correctly", () => {
      const buffer = new CircularBuffer<number>(2)
      
      expect(buffer.isFull).toBe(false)
      
      buffer.add(1)
      expect(buffer.isFull).toBe(false)
      
      buffer.add(2)
      expect(buffer.isFull).toBe(true)
      
      buffer.add(3)
      expect(buffer.isFull).toBe(true)
    })
  })

  describe("complex scenarios", () => {
    it("should handle multiple resize operations", () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.add(1)
      buffer.add(2)
      buffer.add(3)
      buffer.add(4)
      
      expect(buffer.getItems()).toEqual([2, 3, 4])
      
      buffer.resize(5)
      buffer.add(5)
      buffer.add(6)
      
      expect(buffer.getItems()).toEqual([2, 3, 4, 5, 6])
      
      buffer.resize(2)
      
      expect(buffer.getItems()).toEqual([5, 6])
    })

    it("should work with object types", () => {
      type TestObj = { id: number; name: string }
      const buffer = new CircularBuffer<TestObj>(2)
      
      buffer.add({ id: 1, name: "first" })
      buffer.add({ id: 2, name: "second" })
      buffer.add({ id: 3, name: "third" })
      
      expect(buffer.getItems()).toEqual([
        { id: 2, name: "second" },
        { id: 3, name: "third" }
      ])
    })

    it("should handle rapid add/resize cycles", () => {
      const buffer = new CircularBuffer<number>(1)
      
      for (let i = 0; i < 10; i++) {
        buffer.add(i)
        expect(buffer.getItems()).toEqual([i])
      }
      
      buffer.resize(3)
      buffer.add(10)
      buffer.add(11)
      
      expect(buffer.getItems()).toEqual([9, 10, 11])
    })
  })
})