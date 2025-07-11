# Performance Optimization Plan for js.foresight

## Executive Summary

Based on comprehensive research into JavaScript performance optimization for real-time systems, mouse tracking, and spatial algorithms, this document outlines evidence-based optimizations that can significantly improve the js.foresight package's performance. The optimizations focus on hot code paths, memory efficiency, and algorithmic improvements.

## Current Performance Analysis

### Identified Bottlenecks

1. **Mouse Event Processing**: O(n) complexity for every mouse move event
2. **Array Operations**: O(n) shift operations in position history
3. **Memory Allocation**: Object creation in hot paths causing GC pressure
4. **Bounds Calculation**: Repeated `getBoundingClientRect()` calls
5. **Event System**: Unnecessary event object creation and emission

### Performance Research Findings

- Mouse events fire 100+ times per second; handlers should complete in <2-3ms
- Array `push()` + `shift()` operations are O(n) vs O(1) for circular buffers
- Spatial partitioning (quadtrees) provide O(log n) vs O(n) complexity
- Object pooling reduces GC pressure in real-time systems
- RequestAnimationFrame provides optimal 16.67ms intervals with high-precision timing

## Core Performance Issues & Solutions

### 1. Mouse Event Processing Bottleneck (Critical Impact)

**Problem**: Current `handleMouseMove` processes ALL elements on EVERY mouse move

**Research Finding**: Mouse events fire 100+ times per second; handlers should complete in <2-3ms

**Solution**: Implement spatial partitioning with quadtree data structure

- **Expected Impact**: 70-90% reduction in intersection checks
- **Implementation**: O(log n) vs O(n) complexity for element lookup

### 2. Array Operations Performance (High Impact)

**Problem**: `array.push()` + `array.shift()` operations are O(n) on every mouse move

**Research Finding**: Circular buffers provide O(1) operations vs O(n) for array shifts

**Solution**: Replace position history with circular buffer using TypedArray

- **Expected Impact**: 60-80% improvement in trajectory calculations
- **Implementation**: Pre-allocated Float32Array with head/tail pointers

### 3. RequestAnimationFrame Throttling (High Impact)

**Problem**: Mouse events not properly throttled, causing frame drops

**Research Finding**: RAF provides optimal 16.67ms intervals with high-precision timing

**Solution**: Replace current RAF with proper frame rate limiting

- **Expected Impact**: 40-60% reduction in CPU usage during mouse movement
- **Implementation**: Use high-precision timestamp for delta calculations

### 4. Memory Allocation in Hot Paths (Medium Impact)

**Problem**: Creating objects on every mouse move/event emission

**Research Finding**: Object pooling reduces GC pressure in real-time systems

**Solution**: Implement object pooling for frequently created objects

- **Expected Impact**: 30-50% reduction in garbage collection overhead
- **Implementation**: Pre-allocated pools for Point, MousePosition, and event objects

### 5. Bounds Calculation Optimization (Medium Impact)

**Problem**: Multiple `getBoundingClientRect()` calls and rect expansions

**Research Finding**: Spatial data should be cached with dirty flags

**Solution**: Implement cached bounds with invalidation system

- **Expected Impact**: 40-60% improvement in bounds update performance
- **Implementation**: Lazy evaluation with change detection

## Implementation Strategy

### Phase 1: Critical Path Optimizations

#### 1. Circular Buffer Implementation

- Replace `MousePosition[]` with circular buffer
- Use `Float32Array` for better memory layout
- Implement O(1) push/get operations

#### 2. RequestAnimationFrame Throttling

- Implement proper frame rate limiting
- Use high-precision timestamps from RAF callback
- Add frame dropping for slow devices

#### 3. Spatial Partitioning System

- Implement quadtree for element organization
- Dynamic subdivision based on element density
- Viewport-aware culling

### Phase 2: Memory & Event Optimizations

#### 1. Object Pooling

- Pool Point, MousePosition, and event objects
- Implement reset() methods for reuse
- Add pool size management

#### 2. Event System Optimization

- Lazy event object creation
- Event batching for multiple simultaneous events
- Conditional event emission based on listeners

### Phase 3: Advanced Algorithm Optimizations

#### 1. Trajectory Prediction Enhancement

- Use weighted moving averages for smoother predictions
- Implement velocity-based acceleration consideration
- Add curve fitting for non-linear movement

#### 2. Tabbable Elements Cache

- Incremental cache updates instead of full rebuilds
- Smart invalidation based on DOM mutation types
- Predictive prefetching for tab navigation

## Technical Implementation Details

### Circular Buffer Structure

```javascript
class CircularBuffer {
  constructor(capacity) {
    this.buffer = new Float32Array(capacity * 3) // x, y, time
    this.head = 0
    this.tail = 0
    this.size = 0
    this.capacity = capacity
  }

  push(x, y, time) {
    const index = this.head * 3
    this.buffer[index] = x
    this.buffer[index + 1] = y
    this.buffer[index + 2] = time

    this.head = (this.head + 1) % this.capacity
    if (this.size < this.capacity) {
      this.size++
    } else {
      this.tail = (this.tail + 1) % this.capacity
    }
  }

  get(index) {
    if (index >= this.size) return null
    const bufferIndex = ((this.tail + index) % this.capacity) * 3
    return {
      x: this.buffer[bufferIndex],
      y: this.buffer[bufferIndex + 1],
      time: this.buffer[bufferIndex + 2],
    }
  }
}
```

### Quadtree Integration

```javascript
class SpatialIndex {
  constructor(bounds, maxDepth = 6, maxObjects = 10) {
    this.bounds = bounds
    this.maxDepth = maxDepth
    this.maxObjects = maxObjects
    this.objects = []
    this.nodes = []
  }

  insert(object) {
    if (this.nodes.length > 0) {
      const index = this.getIndex(object.bounds)
      if (index !== -1) {
        this.nodes[index].insert(object)
        return
      }
    }

    this.objects.push(object)

    if (this.objects.length > this.maxObjects && this.level < this.maxDepth) {
      if (this.nodes.length === 0) {
        this.split()
      }

      // Redistribute objects
      this.objects = this.objects.filter(obj => {
        const index = this.getIndex(obj.bounds)
        if (index !== -1) {
          this.nodes[index].insert(obj)
          return false
        }
        return true
      })
    }
  }

  retrieve(bounds) {
    const returnObjects = this.objects.slice()

    if (this.nodes.length > 0) {
      const index = this.getIndex(bounds)
      if (index !== -1) {
        returnObjects.push(...this.nodes[index].retrieve(bounds))
      } else {
        // If object overlaps multiple quadrants, check all
        for (const node of this.nodes) {
          returnObjects.push(...node.retrieve(bounds))
        }
      }
    }

    return returnObjects
  }
}
```

### Object Pool Implementation

```javascript
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.pool = []

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn())
    }
  }

  get() {
    if (this.pool.length > 0) {
      return this.pool.pop()
    }
    return this.createFn()
  }

  release(obj) {
    this.resetFn(obj)
    this.pool.push(obj)
  }
}

// Usage
const pointPool = new ObjectPool(
  () => ({ x: 0, y: 0 }),
  point => {
    point.x = 0
    point.y = 0
  }
)
```

### Enhanced RAF Throttling

```javascript
class FrameThrottler {
  constructor(targetFPS = 60) {
    this.targetInterval = 1000 / targetFPS
    this.lastTime = 0
    this.rafId = null
  }

  schedule(callback) {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
    }

    this.rafId = requestAnimationFrame(currentTime => {
      const elapsed = currentTime - this.lastTime

      if (elapsed >= this.targetInterval) {
        this.lastTime = currentTime - (elapsed % this.targetInterval)
        callback(currentTime)
      } else {
        // Schedule for next frame
        this.schedule(callback)
      }
    })
  }
}
```

## Expected Performance Improvements

### Quantified Benefits

- **Mouse Movement Processing**: 70-90% reduction in processing time
- **Memory Usage**: 40-60% reduction in allocations
- **Frame Rate**: Consistent 60fps on modern devices
- **Startup Performance**: 20-30% faster initialization
- **Large Element Sets**: 80-95% improvement with 100+ elements

### Browser Compatibility

- All optimizations maintain ES2015+ compatibility
- Feature detection for TypedArray support
- Graceful degradation for older browsers
- Mobile-specific optimizations

## Files to Modify

### Core Files

- `src/manager/ForesightManager.ts` - Core algorithm updates
- `src/helpers/predictNextMousePosition.ts` - Circular buffer implementation
- `src/helpers/lineSigmentIntersectsRect.ts` - Spatial partitioning integration
- `src/helpers/rectAndHitSlop.ts` - Bounds caching system
- `src/helpers/getFocusedElementIndex.ts` - Cache optimization

### New Files

- `src/utils/CircularBuffer.ts` - Circular buffer implementation
- `src/utils/SpatialIndex.ts` - Quadtree spatial partitioning
- `src/utils/ObjectPool.ts` - Object pooling system
- `src/utils/FrameThrottler.ts` - RAF throttling utilities

## Testing & Validation

### Performance Benchmarks

- Performance benchmarks using Chrome DevTools
- Memory profiling with heap snapshots
- Frame rate monitoring during high-frequency events
- Load testing with 100+ elements

### Cross-Browser Testing

- Chrome, Firefox, Safari, Edge compatibility
- Mobile device testing (iOS Safari, Chrome Mobile)
- Performance regression testing
- Memory leak detection

### Metrics to Track

- Mouse event processing time (target: <2ms)
- Memory usage during extended sessions
- Frame rate consistency (target: 60fps)
- CPU usage during mouse movement
- GC frequency and duration

## Implementation Priority

### High Priority (Phase 1)

1. Circular buffer for position history
2. Spatial partitioning system
3. RAF throttling optimization

### Medium Priority (Phase 2)

1. Object pooling implementation
2. Bounds calculation caching
3. Event system optimization

### Low Priority (Phase 3)

1. Advanced trajectory prediction
2. Tabbable elements cache optimization
3. Performance monitoring tools

## Risk Assessment

### Low Risk

- Circular buffer implementation (well-established pattern)
- Object pooling (minimal API changes)
- RAF throttling (internal optimization)

### Medium Risk

- Spatial partitioning (requires careful testing)
- Bounds caching (needs proper invalidation)

### High Risk

- None identified - all optimizations maintain existing API

## Conclusion

This performance optimization plan is based on proven techniques from game development, real-time systems, and spatial algorithms research. The proposed changes focus on algorithmic improvements and memory optimization while maintaining the existing API and ensuring backward compatibility.

The optimizations are prioritized by impact and risk, allowing for incremental implementation and validation. Expected performance improvements range from 40-90% depending on the specific use case and number of tracked elements.
