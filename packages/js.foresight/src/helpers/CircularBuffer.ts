export class CircularBuffer<T> {
  private buffer: T[]
  private head: number = 0
  private count: number = 0
  private capacity: number

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('CircularBuffer capacity must be greater than 0')
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

  getItems(): T[] {
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

  resize(newCapacity: number): void {
    if (newCapacity <= 0) {
      throw new Error('CircularBuffer capacity must be greater than 0')
    }

    if (newCapacity === this.capacity) {
      return
    }

    const currentItems = this.getItems()
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

  clear(): void {
    this.head = 0
    this.count = 0
  }

  get length(): number {
    return this.count
  }

  get size(): number {
    return this.capacity
  }

  get isFull(): boolean {
    return this.count === this.capacity
  }

  get isEmpty(): boolean {
    return this.count === 0
  }
}