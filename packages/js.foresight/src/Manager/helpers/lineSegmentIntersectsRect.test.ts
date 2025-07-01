import { describe, it, expect } from 'vitest'
import { lineSegmentIntersectsRect } from './lineSigmentIntersectsRect'
import type { Point, Rect } from '../../types/types'

describe('lineSegmentIntersectsRect', () => {
  const testRect: Rect = {
    top: 100,
    left: 100,
    right: 200,
    bottom: 200
  }

  it('should detect intersection when line passes through rectangle', () => {
    const start: Point = { x: 50, y: 150 }
    const end: Point = { x: 250, y: 150 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(true)
  })

  it('should detect intersection when line is diagonal through rectangle', () => {
    const start: Point = { x: 50, y: 50 }
    const end: Point = { x: 250, y: 250 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(true)
  })

  it('should detect intersection when line starts inside rectangle', () => {
    const start: Point = { x: 150, y: 150 }
    const end: Point = { x: 300, y: 300 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(true)
  })

  it('should detect intersection when line ends inside rectangle', () => {
    const start: Point = { x: 50, y: 50 }
    const end: Point = { x: 150, y: 150 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(true)
  })

  it('should detect intersection when both points are inside rectangle', () => {
    const start: Point = { x: 120, y: 120 }
    const end: Point = { x: 180, y: 180 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(true)
  })

  it('should not detect intersection when line is completely outside', () => {
    const start: Point = { x: 50, y: 50 }
    const end: Point = { x: 80, y: 80 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(false)
  })

  it('should not detect intersection when line passes above rectangle', () => {
    const start: Point = { x: 50, y: 50 }
    const end: Point = { x: 250, y: 50 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(false)
  })

  it('should not detect intersection when line passes below rectangle', () => {
    const start: Point = { x: 50, y: 250 }
    const end: Point = { x: 250, y: 250 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(false)
  })

  it('should not detect intersection when line passes to the left', () => {
    const start: Point = { x: 50, y: 100 }
    const end: Point = { x: 50, y: 200 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(false)
  })

  it('should not detect intersection when line passes to the right', () => {
    const start: Point = { x: 250, y: 100 }
    const end: Point = { x: 250, y: 200 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(false)
  })

  it('should handle vertical line intersecting rectangle', () => {
    const start: Point = { x: 150, y: 50 }
    const end: Point = { x: 150, y: 250 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(true)
  })

  it('should handle horizontal line intersecting rectangle', () => {
    const start: Point = { x: 50, y: 150 }
    const end: Point = { x: 250, y: 150 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(true)
  })

  it('should handle line touching rectangle corner', () => {
    const start: Point = { x: 50, y: 50 }
    const end: Point = { x: 100, y: 100 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(true)
  })

  it('should handle line touching rectangle edge', () => {
    const start: Point = { x: 100, y: 50 }
    const end: Point = { x: 100, y: 150 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(true)
  })

  it('should handle zero-length line inside rectangle', () => {
    const point: Point = { x: 150, y: 150 }
    
    expect(lineSegmentIntersectsRect(point, point, testRect)).toBe(true)
  })

  it('should handle zero-length line outside rectangle', () => {
    const point: Point = { x: 50, y: 50 }
    
    expect(lineSegmentIntersectsRect(point, point, testRect)).toBe(false)
  })

  it('should handle rectangle with zero width', () => {
    const zeroWidthRect: Rect = {
      top: 100,
      left: 150,
      right: 150,
      bottom: 200
    }
    
    const start: Point = { x: 100, y: 150 }
    const end: Point = { x: 200, y: 150 }
    
    expect(lineSegmentIntersectsRect(start, end, zeroWidthRect)).toBe(true)
  })

  it('should handle rectangle with zero height', () => {
    const zeroHeightRect: Rect = {
      top: 150,
      left: 100,
      right: 200,
      bottom: 150
    }
    
    const start: Point = { x: 150, y: 100 }
    const end: Point = { x: 150, y: 200 }
    
    expect(lineSegmentIntersectsRect(start, end, zeroHeightRect)).toBe(true)
  })

  it('should handle negative coordinates', () => {
    const negativeRect: Rect = {
      top: -200,
      left: -200,
      right: -100,
      bottom: -100
    }
    
    const start: Point = { x: -250, y: -150 }
    const end: Point = { x: -50, y: -150 }
    
    expect(lineSegmentIntersectsRect(start, end, negativeRect)).toBe(true)
  })

  it('should handle steep diagonal lines', () => {
    const start: Point = { x: 150, y: 0 }
    const end: Point = { x: 151, y: 300 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(true)
  })

  it('should handle shallow diagonal lines', () => {
    const start: Point = { x: 0, y: 150 }
    const end: Point = { x: 300, y: 151 }
    
    expect(lineSegmentIntersectsRect(start, end, testRect)).toBe(true)
  })
})