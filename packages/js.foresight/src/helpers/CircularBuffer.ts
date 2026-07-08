export class CircularBuffer<T> {
  private buffer: T[]
  private head: number = 0
  private count: number = 0
  private capacity: number

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("CircularBuffer capacity must be greater than 0")
    }

    this.capacity = capacity
    this.buffer = new Array(capacity)
  }

  add(item: T): void {
    this.buffer[this.head] = item
    this.head = (this.head + 1) % this.capacity

    if (this.count < this.capacity) {
      this.count++
    }
  }

  /**
   * The slot the next {@link add} will overwrite, or `undefined` if it has not
   * been filled yet. Lets a hot-path caller mutate and re-add the existing
   * object instead of allocating a fresh one on every push.
   */
  peekWriteSlot(): T | undefined {
    return this.buffer[this.head]
  }

  getFirst(): T | undefined {
    if (this.count === 0) {
      return undefined
    }

    if (this.count < this.capacity) {
      return this.buffer[0]
    } else {
      return this.buffer[this.head]
    }
  }

  getLast(): T | undefined {
    if (this.count === 0) {
      return undefined
    }

    if (this.count < this.capacity) {
      return this.buffer[this.count - 1]
    } else {
      const lastIndex = (this.head - 1 + this.capacity) % this.capacity

      return this.buffer[lastIndex]
    }
  }

  resize(newCapacity: number): void {
    if (newCapacity <= 0) {
      throw new Error("CircularBuffer capacity must be greater than 0")
    }

    if (newCapacity === this.capacity) {
      return
    }

    const currentItems = this.getAllItems()
    this.capacity = newCapacity
    this.buffer = new Array(newCapacity)
    this.head = 0
    this.count = 0

    if (currentItems.length > newCapacity) {
      const itemsToKeep = currentItems.slice(-newCapacity)
      for (const item of itemsToKeep) {
        this.add(item)
      }
    } else {
      for (const item of currentItems) {
        this.add(item)
      }
    }
  }

  private getAllItems(): T[] {
    if (this.count === 0) {
      return []
    }

    const result: T[] = new Array(this.count)

    if (this.count < this.capacity) {
      for (let i = 0; i < this.count; i++) {
        result[i] = this.buffer[i]
      }
    } else {
      const startIndex = this.head
      for (let i = 0; i < this.capacity; i++) {
        const bufferIndex = (startIndex + i) % this.capacity
        result[i] = this.buffer[bufferIndex]
      }
    }

    return result
  }

  get length(): number {
    return this.count
  }
}
