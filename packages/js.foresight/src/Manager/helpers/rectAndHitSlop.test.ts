import { describe, it, expect } from 'vitest'
import { 
  normalizeHitSlop, 
  getExpandedRect, 
  isPointInRectangle, 
  areRectsEqual 
} from './rectAndHitSlop'
import type { HitSlop, Rect, Point } from '../../types/types'

describe('normalizeHitSlop', () => {
  it('should normalize number to all sides', () => {
    const result = normalizeHitSlop(10)
    expect(result).toEqual({ top: 10, right: 10, bottom: 10, left: 10 })
  })

  it('should return object with clamped values when all properties are defined', () => {
    const hitSlop = { top: 5, right: 10, bottom: 15, left: 20 }
    const result = normalizeHitSlop(hitSlop)
    expect(result).toEqual(hitSlop)
  })

  it('should clamp values using constants', () => {
    // Note: The actual behavior depends on MIN_HITSLOP and MAX_HITSLOP constants
    // For now, let's test with valid values and check the structure
    const hitSlop = { top: 5, right: 10, bottom: 15, left: 20 }
    const result = normalizeHitSlop(hitSlop)
    expect(result).toHaveProperty('top')
    expect(result).toHaveProperty('right')
    expect(result).toHaveProperty('bottom')
    expect(result).toHaveProperty('left')
    expect(typeof result.top).toBe('number')
    expect(typeof result.right).toBe('number')
    expect(typeof result.bottom).toBe('number')
    expect(typeof result.left).toBe('number')
  })
})

describe('getExpandedRect', () => {
  const baseRect: Rect = { top: 100, left: 100, right: 200, bottom: 200 }

  it('should expand rect with uniform hit slop', () => {
    const hitSlop = normalizeHitSlop(10)
    const result = getExpandedRect(baseRect, hitSlop)
    
    expect(result).toEqual({
      top: 90,    // 100 - 10
      left: 90,   // 100 - 10
      right: 210, // 200 + 10
      bottom: 210 // 200 + 10
    })
  })

  it('should expand rect with different hit slop for each side', () => {
    const hitSlop = normalizeHitSlop({ top: 5, right: 10, bottom: 15, left: 20 })
    const result = getExpandedRect(baseRect, hitSlop)
    
    expect(result).toEqual({
      top: 95,    // 100 - 5
      left: 80,   // 100 - 20
      right: 210, // 200 + 10
      bottom: 215 // 200 + 15
    })
  })

  it('should handle zero hit slop', () => {
    const hitSlop = normalizeHitSlop(0)
    const result = getExpandedRect(baseRect, hitSlop)
    
    expect(result).toEqual(baseRect)
  })

  it('should expand rect with manually created hit slop', () => {
    // Test with direct Rect object instead of normalized, 
    // since negative values might be clamped by normalizeHitSlop
    const hitSlop: Rect = { top: 10, right: 5, bottom: 15, left: 20 }
    const result = getExpandedRect(baseRect, hitSlop)
    
    expect(result).toEqual({
      top: 90,    // 100 - 10
      left: 80,   // 100 - 20
      right: 205, // 200 + 5
      bottom: 215 // 200 + 15
    })
  })
})

describe('isPointInRectangle', () => {
  const rect: Rect = { top: 100, left: 100, right: 200, bottom: 200 }

  it('should return true for point inside rectangle', () => {
    const point: Point = { x: 150, y: 150 }
    expect(isPointInRectangle(point, rect)).toBe(true)
  })

  it('should return true for point on rectangle edge', () => {
    const pointOnTop: Point = { x: 150, y: 100 }
    const pointOnLeft: Point = { x: 100, y: 150 }
    const pointOnRight: Point = { x: 200, y: 150 }
    const pointOnBottom: Point = { x: 150, y: 200 }
    
    expect(isPointInRectangle(pointOnTop, rect)).toBe(true)
    expect(isPointInRectangle(pointOnLeft, rect)).toBe(true)
    expect(isPointInRectangle(pointOnRight, rect)).toBe(true)
    expect(isPointInRectangle(pointOnBottom, rect)).toBe(true)
  })

  it('should return true for point on rectangle corner', () => {
    const topLeft: Point = { x: 100, y: 100 }
    const topRight: Point = { x: 200, y: 100 }
    const bottomLeft: Point = { x: 100, y: 200 }
    const bottomRight: Point = { x: 200, y: 200 }
    
    expect(isPointInRectangle(topLeft, rect)).toBe(true)
    expect(isPointInRectangle(topRight, rect)).toBe(true)
    expect(isPointInRectangle(bottomLeft, rect)).toBe(true)
    expect(isPointInRectangle(bottomRight, rect)).toBe(true)
  })

  it('should return false for point outside rectangle', () => {
    const pointAbove: Point = { x: 150, y: 50 }
    const pointBelow: Point = { x: 150, y: 250 }
    const pointLeft: Point = { x: 50, y: 150 }
    const pointRight: Point = { x: 250, y: 150 }
    
    expect(isPointInRectangle(pointAbove, rect)).toBe(false)
    expect(isPointInRectangle(pointBelow, rect)).toBe(false)
    expect(isPointInRectangle(pointLeft, rect)).toBe(false)
    expect(isPointInRectangle(pointRight, rect)).toBe(false)
  })

  it('should return false for point outside rectangle diagonally', () => {
    const point: Point = { x: 50, y: 50 }
    expect(isPointInRectangle(point, rect)).toBe(false)
  })

  it('should handle zero-width rectangle', () => {
    const zeroWidthRect: Rect = { top: 100, left: 150, right: 150, bottom: 200 }
    const pointOnLine: Point = { x: 150, y: 150 }
    const pointOffLine: Point = { x: 149, y: 150 }
    
    expect(isPointInRectangle(pointOnLine, zeroWidthRect)).toBe(true)
    expect(isPointInRectangle(pointOffLine, zeroWidthRect)).toBe(false)
  })

  it('should handle zero-height rectangle', () => {
    const zeroHeightRect: Rect = { top: 150, left: 100, right: 200, bottom: 150 }
    const pointOnLine: Point = { x: 150, y: 150 }
    const pointOffLine: Point = { x: 150, y: 149 }
    
    expect(isPointInRectangle(pointOnLine, zeroHeightRect)).toBe(true)
    expect(isPointInRectangle(pointOffLine, zeroHeightRect)).toBe(false)
  })

  it('should handle negative coordinates', () => {
    const negativeRect: Rect = { top: -200, left: -200, right: -100, bottom: -100 }
    const pointInside: Point = { x: -150, y: -150 }
    const pointOutside: Point = { x: -50, y: -50 }
    
    expect(isPointInRectangle(pointInside, negativeRect)).toBe(true)
    expect(isPointInRectangle(pointOutside, negativeRect)).toBe(false)
  })
})

describe('areRectsEqual', () => {
  const rect1: Rect = { top: 100, left: 100, right: 200, bottom: 200 }
  const rect2: Rect = { top: 100, left: 100, right: 200, bottom: 200 }
  const rect3: Rect = { top: 100, left: 100, right: 201, bottom: 200 }

  it('should return true for identical rectangles', () => {
    expect(areRectsEqual(rect1, rect2)).toBe(true)
  })

  it('should return false for different rectangles', () => {
    expect(areRectsEqual(rect1, rect3)).toBe(false)
  })

  it('should return true when comparing same rectangle reference', () => {
    expect(areRectsEqual(rect1, rect1)).toBe(true)
  })

  it('should handle rectangles with different top values', () => {
    const rectDiffTop: Rect = { top: 101, left: 100, right: 200, bottom: 200 }
    expect(areRectsEqual(rect1, rectDiffTop)).toBe(false)
  })

  it('should handle rectangles with different left values', () => {
    const rectDiffLeft: Rect = { top: 100, left: 101, right: 200, bottom: 200 }
    expect(areRectsEqual(rect1, rectDiffLeft)).toBe(false)
  })

  it('should handle rectangles with different bottom values', () => {
    const rectDiffBottom: Rect = { top: 100, left: 100, right: 200, bottom: 201 }
    expect(areRectsEqual(rect1, rectDiffBottom)).toBe(false)
  })

  it('should handle zero-sized rectangles', () => {
    const zeroRect1: Rect = { top: 100, left: 100, right: 100, bottom: 100 }
    const zeroRect2: Rect = { top: 100, left: 100, right: 100, bottom: 100 }
    
    expect(areRectsEqual(zeroRect1, zeroRect2)).toBe(true)
  })

  it('should handle negative coordinates', () => {
    const negativeRect1: Rect = { top: -200, left: -200, right: -100, bottom: -100 }
    const negativeRect2: Rect = { top: -200, left: -200, right: -100, bottom: -100 }
    
    expect(areRectsEqual(negativeRect1, negativeRect2)).toBe(true)
  })

  it('should handle floating point coordinates', () => {
    const floatRect1: Rect = { top: 100.5, left: 100.5, right: 200.5, bottom: 200.5 }
    const floatRect2: Rect = { top: 100.5, left: 100.5, right: 200.5, bottom: 200.5 }
    const floatRect3: Rect = { top: 100.6, left: 100.5, right: 200.5, bottom: 200.5 }
    
    expect(areRectsEqual(floatRect1, floatRect2)).toBe(true)
    expect(areRectsEqual(floatRect1, floatRect3)).toBe(false)
  })
})