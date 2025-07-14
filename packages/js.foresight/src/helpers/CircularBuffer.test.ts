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
      expect(buffer.getFirst()).toBe("first")
      expect(buffer.getLast()).toBe("first")
      
      buffer.add("second")
      expect(buffer.length).toBe(2)
      expect(buffer.getFirst()).toBe("first")
      expect(buffer.getLast()).toBe("second")
    })

    it("should fill buffer to capacity", () => {
      const buffer = new CircularBuffer<number>(3)
      
      buffer.add(1)
      buffer.add(2)
      buffer.add(3)
      
      expect(buffer.length).toBe(3)
      expect(buffer.isFull).toBe(true)
      expect(buffer.getFirst()).toBe(1)
      expect(buffer.getLast()).toBe(3)
    })

    it("should overwrite oldest items when buffer is full", () => {
      const buffer = new CircularBuffer<number>(3)
      
      buffer.add(1)
      buffer.add(2)
      buffer.add(3)
      buffer.add(4)
      
      expect(buffer.length).toBe(3)
      expect(buffer.getFirst()).toBe(2)
      expect(buffer.getLast()).toBe(4)
      
      buffer.add(5)
      expect(buffer.getFirst()).toBe(3)
      expect(buffer.getLast()).toBe(5)
    })

    it("should maintain chronological order when wrapping", () => {
      const buffer = new CircularBuffer<string>(2)
      
      buffer.add("a")
      buffer.add("b")
      buffer.add("c")
      buffer.add("d")
      
      expect(buffer.getFirst()).toBe("c")
      expect(buffer.getLast()).toBe("d")
    })
  })

  describe("getFirst", () => {
    it("should return undefined for empty buffer", () => {
      const buffer = new CircularBuffer<number>(5)
      expect(buffer.getFirst()).toBeUndefined()
    })

    it("should return first item", () => {
      const buffer = new CircularBuffer<number>(4)
      
      buffer.add(10)
      buffer.add(20)
      buffer.add(30)
      
      expect(buffer.getFirst()).toBe(10)
    })

    it("should return correct first item after wrapping", () => {
      const buffer = new CircularBuffer<number>(3)
      
      buffer.add(1)
      buffer.add(2)
      buffer.add(3)
      buffer.add(4)
      buffer.add(5)
      
      expect(buffer.getFirst()).toBe(3)
    })
  })

  describe("getLast", () => {
    it("should return undefined for empty buffer", () => {
      const buffer = new CircularBuffer<number>(5)
      expect(buffer.getLast()).toBeUndefined()
    })

    it("should return last item", () => {
      const buffer = new CircularBuffer<number>(4)
      
      buffer.add(10)
      buffer.add(20)
      buffer.add(30)
      
      expect(buffer.getLast()).toBe(30)
    })

    it("should return correct last item after wrapping", () => {
      const buffer = new CircularBuffer<number>(3)
      
      buffer.add(1)
      buffer.add(2)
      buffer.add(3)
      buffer.add(4)
      buffer.add(5)
      
      expect(buffer.getLast()).toBe(5)
    })
  })

  describe("getFirstLast", () => {
    it("should return [undefined, undefined] for empty buffer", () => {
      const buffer = new CircularBuffer<number>(5)
      expect(buffer.getFirstLast()).toEqual([undefined, undefined])
    })

    it("should return [item, item] for single item", () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.add(42)
      
      expect(buffer.getFirstLast()).toEqual([42, 42])
    })

    it("should return [first, last] for multiple items", () => {
      const buffer = new CircularBuffer<number>(4)
      
      buffer.add(10)
      buffer.add(20)
      buffer.add(30)
      
      expect(buffer.getFirstLast()).toEqual([10, 30])
    })

    it("should return correct [first, last] after wrapping", () => {
      const buffer = new CircularBuffer<number>(3)
      
      buffer.add(1)
      buffer.add(2)
      buffer.add(3)
      buffer.add(4)
      buffer.add(5)
      
      expect(buffer.getFirstLast()).toEqual([3, 5])
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
      expect(buffer.getFirst()).toBe(1)
      expect(buffer.getLast()).toBe(2)
      
      buffer.add(3)
      buffer.add(4)
      expect(buffer.getFirst()).toBe(1)
      expect(buffer.getLast()).toBe(4)
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
      expect(buffer.getFirst()).toBe(3)
      expect(buffer.getLast()).toBe(5)
    })

    it("should handle resizing to same capacity", () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.add(1)
      buffer.add(2)
      
      buffer.resize(3)
      
      expect(buffer.size).toBe(3)
      expect(buffer.length).toBe(2)
      expect(buffer.getFirst()).toBe(1)
      expect(buffer.getLast()).toBe(2)
    })

    it("should handle resizing with wrapped buffer", () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.add(1)
      buffer.add(2)
      buffer.add(3)
      buffer.add(4)
      
      expect(buffer.getFirst()).toBe(2)
      expect(buffer.getLast()).toBe(4)
      
      buffer.resize(2)
      
      expect(buffer.size).toBe(2)
      expect(buffer.length).toBe(2)
      expect(buffer.getFirst()).toBe(3)
      expect(buffer.getLast()).toBe(4)
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
      expect(buffer.getFirst()).toBeUndefined()
      expect(buffer.getLast()).toBeUndefined()
    })

    it("should clear partially filled buffer", () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.add(1)
      buffer.add(2)
      
      buffer.clear()
      
      expect(buffer.length).toBe(0)
      expect(buffer.isEmpty).toBe(true)
      expect(buffer.getFirst()).toBeUndefined()
      expect(buffer.getLast()).toBeUndefined()
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
      expect(buffer.getFirst()).toBeUndefined()
      expect(buffer.getLast()).toBeUndefined()
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
      
      expect(buffer.getFirst()).toBe(2)
      expect(buffer.getLast()).toBe(4)
      
      buffer.resize(5)
      buffer.add(5)
      buffer.add(6)
      
      expect(buffer.getFirst()).toBe(2)
      expect(buffer.getLast()).toBe(6)
      
      buffer.resize(2)
      
      expect(buffer.getFirst()).toBe(5)
      expect(buffer.getLast()).toBe(6)
    })

    it("should work with object types", () => {
      type TestObj = { id: number; name: string }
      const buffer = new CircularBuffer<TestObj>(2)
      
      buffer.add({ id: 1, name: "first" })
      buffer.add({ id: 2, name: "second" })
      buffer.add({ id: 3, name: "third" })
      
      expect(buffer.getFirst()).toEqual({ id: 2, name: "second" })
      expect(buffer.getLast()).toEqual({ id: 3, name: "third" })
    })

    it("should handle rapid add/resize cycles", () => {
      const buffer = new CircularBuffer<number>(1)
      
      for (let i = 0; i < 10; i++) {
        buffer.add(i)
        expect(buffer.getFirst()).toBe(i)
        expect(buffer.getLast()).toBe(i)
      }
      
      buffer.resize(3)
      buffer.add(10)
      buffer.add(11)
      
      expect(buffer.getFirst()).toBe(9)
      expect(buffer.getLast()).toBe(11)
    })
  })
})