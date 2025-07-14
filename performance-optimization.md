# ForesightJS Performance Optimization Guide

## **Critical Performance Bottlenecks**

### 1. **Memory Leaks in Element Overlays**
**Location:** `element-overlays.ts:214-223`

**Issue:** Timeout cleanup is inconsistent, animation timeouts persist after component unmount

**Fix:**
```typescript
private clearCallbackAnimationTimeout(element: ForesightElement) {
  const existingAnimation = this.callbackAnimations.get(element)
  if (existingAnimation) {
    clearTimeout(existingAnimation.timeoutId)
    this.callbackAnimations.delete(element)
  }
}

disconnectedCallback(): void {
  super.disconnectedCallback()
  this.callbackAnimations.forEach(animation => {
    clearTimeout(animation.timeoutId)
  })
  this.callbackAnimations.clear()
  this._abortController?.abort()
}
```

### 2. **Expensive Line Intersection Calculations**
**Location:** `MousePredictor.ts:92-96`

**Issue:** Repeated expensive geometric calculations without caching

**Fix:**
```typescript
private intersectionCache = new Map<string, boolean>()

private getCachedIntersection(p1: Point, p2: Point, rect: Rect): boolean {
  const key = `${p1.x},${p1.y},${p2.x},${p2.y},${rect.left},${rect.top},${rect.right},${rect.bottom}`
  if (this.intersectionCache.has(key)) {
    return this.intersectionCache.get(key)!
  }
  const result = lineSegmentIntersectsRect(p1, p2, rect)
  this.intersectionCache.set(key, result)
  return result
}
```

### 3. **Inefficient DOM Operations**
**Location:** `element-overlays.ts:165-175`

**Issue:** Direct DOM manipulation instead of reactive system

**Fix:**
```typescript
// Use Lit's reactive system instead of direct DOM manipulation
@state() private overlayElements: OverlayElement[] = []

private createElementOverlays() {
  this.overlayElements = this.manager.getElementsData().map(data => ({
    element: data.element,
    bounds: data.bounds,
    id: data.elementId
  }))
}

// In render method, use reactive templates
render() {
  return html`
    ${this.overlayElements.map(overlay => html`
      <div class="overlay" style="transform: translate(${overlay.bounds.left}px, ${overlay.bounds.top}px)">
        ${overlay.id}
      </div>
    `)}
  `
}
```

## **Caching and Memoization Optimizations**

### 1. **Cache Expanded Rectangle Calculations**
**Location:** `rectAndHitSlop.ts:41-48`

```typescript
const rectCache = new WeakMap<DOMRect, Map<string, Rect>>()

export function getExpandedRectCached(baseRect: Rect | DOMRect, hitSlop: Rect): Rect {
  const hitSlopKey = `${hitSlop.top},${hitSlop.left},${hitSlop.right},${hitSlop.bottom}`
  let cache = rectCache.get(baseRect as DOMRect)
  if (!cache) {
    cache = new Map()
    rectCache.set(baseRect as DOMRect, cache)
  }
  if (cache.has(hitSlopKey)) {
    return cache.get(hitSlopKey)!
  }
  const result = getExpandedRect(baseRect, hitSlop)
  cache.set(hitSlopKey, result)
  return result
}
```

### 2. **Debounce Cache Invalidation**
**Location:** `TabPredictor.ts:77-79`

```typescript
private cacheInvalidationDebounce: ReturnType<typeof setTimeout> | null = null

public invalidateCache() {
  if (this.cacheInvalidationDebounce) {
    clearTimeout(this.cacheInvalidationDebounce)
  }
  this.cacheInvalidationDebounce = setTimeout(() => {
    this.tabbableElementsCache = []
    this.lastFocusedIndex = null
  }, 100)
}
```

### 3. **Memoize Sorted Elements**
**Location:** `element-tab.ts:301-325`

```typescript
private sortedElementsCache: (ForesightElementData & { elementId: string })[] = []
private lastSortOrder: SortElementList | null = null

private getSortedElements(): (ForesightElementData & { elementId: string })[] {
  if (this.lastSortOrder === this.sortOrder && this.sortedElementsCache.length) {
    return this.sortedElementsCache
  }
  
  this.sortedElementsCache = this.computeSortedElements()
  this.lastSortOrder = this.sortOrder
  return this.sortedElementsCache
}
```

## **Lit Component Re-render Optimizations**

### 1. **Optimize shouldUpdate**
**Location:** `element-tab.ts:218-221`

```typescript
shouldUpdate(changedProperties: Map<string, any>): boolean {
  return changedProperties.has('elementListItems') || 
         changedProperties.has('sortOrder') ||
         changedProperties.has('expandedElementIds')
}

private batchedUpdate = false

private handleElementUpdate(e: CustomEvent) {
  this.elementListItems.set(e.elementData.element, updatedElementWithId)
  this.updateVisibilityCounts()
  
  if (!this.batchedUpdate) {
    this.batchedUpdate = true
    requestAnimationFrame(() => {
      this.requestUpdate()
      this.batchedUpdate = false
    })
  }
}
```

### 2. **Throttle Mouse Trajectory Updates**
**Location:** `MousePredictor.ts:102-107`

```typescript
private trajectoryUpdateThrottle = 16 // 60fps
private lastTrajectoryUpdate = 0

private emitTrajectoryUpdate() {
  const now = performance.now()
  if (now - this.lastTrajectoryUpdate > this.trajectoryUpdateThrottle) {
    this.emit({
      type: "mouseTrajectoryUpdate",
      predictionEnabled: this.enableMousePrediction,
      trajectoryPositions: this.trajectoryPositions,
    })
    this.lastTrajectoryUpdate = now
  }
}
```

## **Bundle Size Optimizations**

### 1. **Enable Code Splitting**
**Location:** `tsup.config.ts`

```typescript
export default defineConfig({
  entry: {
    index: "src/index.ts",
    'control-panel': "src/lit-entry/control-panel/control-panel.ts",
    'debug-overlay': "src/lit-entry/debug-overlay/debug-overlay.ts"
  },
  format: ["esm"],
  splitting: true,
  minify: true,
  treeshake: true,
  external: ["lit", "tabbable"]
})
```

### 2. **Lazy Load Devtools Components**
**Location:** `foresight-devtools.ts`

```typescript
render() {
  if (!this.isInitialized || !this.devtoolsSettings.showDebugger) {
    return html``
  }
  return html`
    ${until(
      import('./control-panel/control-panel.js').then(() => 
        html`<control-panel .settings=${this.devtoolsSettings}></control-panel>`
      ),
      html`<div>Loading...</div>`
    )}
  `
}
```

## **Async Operations**

### 1. **Batch DOM Updates**
**Location:** `ForesightManager.ts:495-509`

```typescript
private pendingUpdates = new Set<ForesightElement>()
private updateScheduled = false

private scheduleUpdate(element: ForesightElement) {
  this.pendingUpdates.add(element)
  if (!this.updateScheduled) {
    this.updateScheduled = true
    requestAnimationFrame(() => this.processPendingUpdates())
  }
}

private processPendingUpdates() {
  this.pendingUpdates.forEach(element => {
    this.updateElementBounds(element)
  })
  this.pendingUpdates.clear()
  this.updateScheduled = false
}
```

### 2. **Async Element Registration**
**Location:** `ForesightManager.ts:200-263`

```typescript
public async registerAsync(options: ForesightRegisterOptions): Promise<ForesightRegisterResult> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      const result = this.register(options)
      resolve(result)
    })
  })
}
```

## **Position Update Optimization**

### 1. **Batch Position Changes**
**Location:** `ForesightManager.ts:574-598`

```typescript
private positionUpdateBatch = new Map<ForesightElement, PositionObserverEntry>()

private handlePositionChange = (entries: PositionObserverEntry[]) => {
  entries.forEach(entry => {
    this.positionUpdateBatch.set(entry.target, entry)
  })
  
  requestAnimationFrame(() => {
    this.processBatchedPositionUpdates()
  })
}

private processBatchedPositionUpdates() {
  this.positionUpdateBatch.forEach((entry, element) => {
    this.updateElementPosition(element, entry)
  })
  this.positionUpdateBatch.clear()
}
```

## **Advanced Optimizations**

### 1. **Web Worker for Heavy Computations**
Create `trajectory-worker.ts`:

```typescript
// trajectory-worker.ts
self.addEventListener('message', (e) => {
  const { positions, predictionTime } = e.data
  const prediction = calculateTrajectoryPrediction(positions, predictionTime)
  self.postMessage({ prediction })
})

// In MousePredictor.ts
private trajectoryWorker = new Worker('./trajectory-worker.js')

private calculateTrajectoryAsync(positions: Point[], predictionTime: number) {
  return new Promise(resolve => {
    this.trajectoryWorker.postMessage({ positions, predictionTime })
    this.trajectoryWorker.onmessage = (e) => resolve(e.data.prediction)
  })
}
```

### 2. **Virtual Scrolling for Large Element Lists**
**Location:** `element-tab.ts`

```typescript
private virtualizedElements: (ForesightElementData & { elementId: string })[] = []
private scrollTop = 0
private itemHeight = 50

private getVisibleElements() {
  const containerHeight = 400
  const startIndex = Math.floor(this.scrollTop / this.itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / this.itemHeight),
    this.virtualizedElements.length
  )
  return this.virtualizedElements.slice(startIndex, endIndex)
}
```

### 3. **Performance Monitoring**
Add performance tracking:

```typescript
private performanceMonitor = {
  measureTime<T>(label: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    console.debug(`[ForesightJS] ${label}: ${end - start}ms`)
    return result
  }
}

// Usage
this.performanceMonitor.measureTime('Element Registration', () => {
  return this.registerElement(options)
})
```

## **Implementation Priority**

### **Immediate (High Impact)**
1. Fix memory leaks in element overlays
2. Implement line intersection caching
3. Add trajectory update throttling
4. Optimize Lit component re-renders

### **Short Term (Medium Impact)**
1. Batch DOM position updates
2. Implement sorted elements memoization
3. Add bundle code splitting
4. Optimize rectangle calculations caching

### **Long Term (Lower Impact)**
1. Implement web worker for heavy computations
2. Add virtual scrolling for large lists
3. Comprehensive performance monitoring
4. Advanced CSS optimizations

## **Performance Metrics to Track**

- **Registration time**: < 5ms per element
- **Prediction calculation**: < 1ms per mouse move
- **Element overlay updates**: < 16ms (60fps)
- **Bundle size**: < 100KB minified
- **Memory usage**: No memory leaks over 10 minutes
- **CPU usage**: < 5% during idle state

These optimizations will significantly improve ForesightJS performance while maintaining all existing functionality.