# ForesightJS Clean Code Best Practices

## **Code Duplication & Complexity**

### 1. **Extract Generic Setting Updates**
**Problem:** Repetitive setting update logic in `ForesightManager.ts:323-487`

**Solution:**
```typescript
private updateSettingWithTracking<K extends keyof ForesightManagerSettings>(
  setting: K,
  newValue: ForesightManagerSettings[K] | undefined,
  constraints?: { min?: number; max?: number }
): boolean {
  const oldValue = this._globalSettings[setting]
  let changed = false
  
  if (typeof newValue === 'number' && constraints) {
    changed = this.updateNumericSettings(newValue, setting as NumericSettingKeys, constraints.min!, constraints.max!)
  } else if (typeof newValue === 'boolean') {
    changed = this.updateBooleanSetting(newValue, setting as ManagerBooleanSettingKeys)
  }
  
  if (changed) {
    this.changedSettings.push({ setting, oldValue, newValue: this._globalSettings[setting] })
  }
  
  return changed
}
```

### 2. **Split Complex Constructor**
**Problem:** ForesightManager constructor has too many responsibilities

**Solution:**
```typescript
private initializeDefaultSettings(): ForesightManagerSettings {
  return {
    debug: false,
    enableMousePrediction: DEFAULT_ENABLE_MOUSE_PREDICTION,
    enableScrollPrediction: DEFAULT_ENABLE_SCROLL_PREDICTION,
    enableTabPrediction: DEFAULT_ENABLE_TAB_PREDICTION,
    trajectoryPredictionTime: DEFAULT_TRAJECTORY_PREDICTION_TIME,
    positionHistorySize: DEFAULT_POSITION_HISTORY_SIZE,
    tabOffset: DEFAULT_TAB_OFFSET,
    scrollMargin: DEFAULT_SCROLL_MARGIN,
  }
}

private initializeCallbackHits(): CallbackHits {
  return {
    mouse: { hover: 0, trajectory: 0 },
    tab: { forwards: 0, reverse: 0 },
    scroll: { down: 0, left: 0, right: 0, up: 0 },
    total: 0,
  }
}

constructor(settings?: Partial<ForesightManagerSettings>) {
  this._globalSettings = { ...this.initializeDefaultSettings(), ...settings }
  this._callbackHits = this.initializeCallbackHits()
  this.setupEventListeners()
}
```

### 3. **Simplify Callback Execution**
**Problem:** Mixed async/sync patterns in `callCallback` method

**Solution:**
```typescript
private executeCallback(elementData: ForesightElementData, callbackHitType: CallbackHitType): void {
  if (elementData.isRunningCallback) return
  
  elementData.isRunningCallback = true
  this.updateHitCounters(callbackHitType)
  this.emitCallbackInvoked(elementData, callbackHitType)
  
  const startTime = performance.now()
  
  try {
    const result = elementData.callback()
    
    if (result instanceof Promise) {
      result
        .then(() => this.emitCallbackCompleted(elementData, callbackHitType, startTime, 'success'))
        .catch(error => this.emitCallbackCompleted(elementData, callbackHitType, startTime, 'error', error))
    } else {
      this.emitCallbackCompleted(elementData, callbackHitType, startTime, 'success')
    }
  } catch (error) {
    this.emitCallbackCompleted(elementData, callbackHitType, startTime, 'error', error)
  }
  
  this.unregister(elementData.element, "callbackHit")
}
```

## **Abstraction & Maintainability**

### 1. **Create Predictor Interface**
**Problem:** Tight coupling between manager and predictors

**Solution:**
```typescript
interface PredictorContext {
  readonly elements: ReadonlyMap<ForesightElement, ForesightElementData>
  readonly settings: Readonly<ForesightManagerSettings>
  executeCallback(elementData: ForesightElementData, hitType: CallbackHitType): void
  emitEvent<K extends ForesightEvent>(event: ForesightEventMap[K]): void
}

abstract class BasePredictor {
  protected constructor(protected context: PredictorContext) {}
  
  abstract start(): void
  abstract stop(): void
  abstract predict(data: any): void
}
```

### 2. **Type-Safe Event System**
**Problem:** String-based event types without compile-time validation

**Solution:**
```typescript
class TypedEventEmitter<TEventMap extends Record<string, any>> {
  private listeners = new Map<keyof TEventMap, Function[]>()
  
  on<K extends keyof TEventMap>(
    event: K,
    listener: (data: TEventMap[K]) => void
  ): void {
    const handlers = this.listeners.get(event) || []
    handlers.push(listener)
    this.listeners.set(event, handlers)
  }
  
  emit<K extends keyof TEventMap>(event: K, data: TEventMap[K]): void {
    const handlers = this.listeners.get(event) || []
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        this.handleError(error, `Event handler for ${String(event)}`)
      }
    })
  }
  
  private handleError(error: unknown, context: string): void {
    console.error(`[ForesightJS] ${context}:`, error)
  }
}
```

### 3. **Standardize Error Handling**
**Problem:** Inconsistent error handling throughout codebase

**Solution:**
```typescript
abstract class BaseComponent {
  protected handleError(error: unknown, context: string, shouldThrow = false): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const fullContext = `${this.constructor.name}.${context}`
    
    console.error(`[ForesightJS] ${fullContext}: ${errorMessage}`, error)
    
    if (shouldThrow) {
      throw new Error(`${fullContext}: ${errorMessage}`)
    }
  }
  
  protected validateRequired<T>(value: T | undefined | null, name: string): T {
    if (value === undefined || value === null) {
      throw new Error(`${name} is required`)
    }
    return value
  }
}
```

## **Configuration & Constants**

### 1. **Semantic Configuration Objects**
**Problem:** Scattered constants lack semantic grouping

**Solution:**
```typescript
export const TRAJECTORY_CONFIG = {
  PREDICTION_TIME: {
    MIN: 10,
    MAX: 200,
    DEFAULT: 120,
    UNIT: 'ms'
  }
} as const

export const POSITION_CONFIG = {
  HISTORY_SIZE: {
    MIN: 2,
    MAX: 30,
    DEFAULT: 8,
    UNIT: 'points'
  }
} as const

export const SCROLL_CONFIG = {
  MARGIN: {
    MIN: 0,
    MAX: 100,
    DEFAULT: 20,
    UNIT: 'px'
  }
} as const

export const TAB_CONFIG = {
  OFFSET: {
    MIN: 0,
    MAX: 10,
    DEFAULT: 1,
    UNIT: 'elements'
  }
} as const

export const CONSTRAINTS = {
  TRAJECTORY_PREDICTION_TIME: TRAJECTORY_CONFIG.PREDICTION_TIME,
  POSITION_HISTORY_SIZE: POSITION_CONFIG.HISTORY_SIZE,
  SCROLL_MARGIN: SCROLL_CONFIG.MARGIN,
  TAB_OFFSET: TAB_CONFIG.OFFSET,
} as const
```

### 2. **Z-Index Management**
**Problem:** Magic numbers for z-index values

**Solution:**
```typescript
export const Z_INDEX = {
  DEBUG_OVERLAY: 9999,
  CONTROL_PANEL: 10001,
  MODAL_OVERLAY: 10002,
  TOOLTIP: 10003,
} as const

export const CSS_CLASSES = {
  OVERLAY: 'foresight-overlay',
  CONTROL_PANEL: 'foresight-control-panel',
  ELEMENT_HIGHLIGHT: 'foresight-highlight',
  NAME_TAG: 'foresight-name-tag',
} as const
```

## **Input Validation & Error Handling**

### 1. **Comprehensive Registration Validation**
**Problem:** Insufficient input validation in register method

**Solution:**
```typescript
private validateRegisterOptions(options: ForesightRegisterOptions): void {
  this.validateRequired(options.element, 'options.element')
  this.validateRequired(options.callback, 'options.callback')
  
  if (!options.element.isConnected) {
    throw new Error('Element must be connected to the DOM')
  }
  
  if (typeof options.callback !== 'function') {
    throw new Error('Callback must be a function')
  }
  
  if (options.hitSlop !== undefined) {
    this.validateHitSlop(options.hitSlop)
  }
  
  if (options.name !== undefined && typeof options.name !== 'string') {
    throw new Error('Name must be a string')
  }
}

private validateHitSlop(hitSlop: number | Rect): void {
  if (typeof hitSlop === 'number') {
    if (hitSlop < 0 || hitSlop > 1000) {
      throw new Error('HitSlop must be between 0 and 1000 pixels')
    }
  } else if (typeof hitSlop === 'object') {
    const requiredProps = ['top', 'left', 'right', 'bottom']
    for (const prop of requiredProps) {
      if (typeof hitSlop[prop] !== 'number') {
        throw new Error(`HitSlop.${prop} must be a number`)
      }
    }
  } else {
    throw new Error('HitSlop must be a number or Rect object')
  }
}
```

### 2. **Settings Validation**
**Problem:** No validation for settings updates

**Solution:**
```typescript
private validateSettings(settings: Partial<UpdateForsightManagerSettings>): void {
  if (settings.trajectoryPredictionTime !== undefined) {
    this.validateNumericSetting(
      settings.trajectoryPredictionTime,
      'trajectoryPredictionTime',
      CONSTRAINTS.TRAJECTORY_PREDICTION_TIME
    )
  }
  
  if (settings.positionHistorySize !== undefined) {
    this.validateNumericSetting(
      settings.positionHistorySize,
      'positionHistorySize',
      CONSTRAINTS.POSITION_HISTORY_SIZE
    )
  }
}

private validateNumericSetting(
  value: number,
  name: string,
  constraint: { MIN: number; MAX: number }
): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${name} must be a valid number`)
  }
  
  if (value < constraint.MIN || value > constraint.MAX) {
    throw new Error(`${name} must be between ${constraint.MIN} and ${constraint.MAX}`)
  }
}
```

## **Type Safety & Organization**

### 1. **Split Complex Types**
**Problem:** Overly complex type definitions

**Solution:**
```typescript
interface ElementMetadata {
  element: ForesightElement
  name: string
  registerCount: number
  elementId: string
}

interface ElementState {
  isHovering: boolean
  isIntersectingWithViewport: boolean
  isRunningCallback: boolean
}

interface ElementGeometry {
  elementBounds: ElementBounds
  hitSlop: Rect
}

interface ElementBehavior {
  callback: ForesightCallback
  trajectoryHitData: TrajectoryHitData
}

type ForesightElementData = ElementMetadata & ElementState & ElementGeometry & ElementBehavior

// Helper types for better type safety
type ElementDataUpdate = Partial<Pick<ForesightElementData, 'isHovering' | 'isIntersectingWithViewport'>>
type ElementBoundsUpdate = Pick<ForesightElementData, 'elementBounds'>
```

### 2. **Improved Event Types**
**Problem:** Loose typing for event data

**Solution:**
```typescript
interface BaseEvent {
  type: ForesightEvent
  timestamp: number
  elementData?: ForesightElementData
}

interface CallbackEvent extends BaseEvent {
  type: 'callbackInvoked' | 'callbackCompleted'
  elementData: ForesightElementData
  callbackHitType: CallbackHitType
  executionTime?: number
  status?: 'success' | 'error'
  error?: Error
}

interface TrajectoryEvent extends BaseEvent {
  type: 'mouseTrajectoryUpdate' | 'scrollTrajectoryUpdate'
  predictionEnabled: boolean
  trajectoryPositions: Point[]
  predictedElement?: ForesightElementData
}

type ForesightEventMap = {
  callbackInvoked: CallbackEvent
  callbackCompleted: CallbackEvent
  mouseTrajectoryUpdate: TrajectoryEvent
  scrollTrajectoryUpdate: TrajectoryEvent
  // ... other events
}
```

## **Code Organization & Structure**

### 1. **Extract Element Registry**
**Problem:** Manager handles too many responsibilities

**Solution:**
```typescript
class ElementRegistry {
  private elements = new Map<ForesightElement, ForesightElementData>()
  private elementsByName = new Map<string, ForesightElementData>()
  
  register(element: ForesightElement, data: ForesightElementData): void {
    this.elements.set(element, data)
    if (data.name) {
      this.elementsByName.set(data.name, data)
    }
  }
  
  unregister(element: ForesightElement): ForesightElementData | undefined {
    const data = this.elements.get(element)
    if (data) {
      this.elements.delete(element)
      if (data.name) {
        this.elementsByName.delete(data.name)
      }
    }
    return data
  }
  
  get(element: ForesightElement): ForesightElementData | undefined {
    return this.elements.get(element)
  }
  
  getByName(name: string): ForesightElementData | undefined {
    return this.elementsByName.get(name)
  }
  
  has(element: ForesightElement): boolean {
    return this.elements.has(element)
  }
  
  values(): IterableIterator<ForesightElementData> {
    return this.elements.values()
  }
  
  size(): number {
    return this.elements.size
  }
  
  clear(): void {
    this.elements.clear()
    this.elementsByName.clear()
  }
}
```

### 2. **Settings Manager**
**Problem:** Settings management mixed with other responsibilities

**Solution:**
```typescript
class SettingsManager {
  private settings: ForesightManagerSettings
  private changeTracker: SettingsChangeTracker
  
  constructor(initialSettings: Partial<ForesightManagerSettings> = {}) {
    this.settings = { ...this.getDefaultSettings(), ...initialSettings }
    this.changeTracker = new SettingsChangeTracker(this.settings)
  }
  
  update(newSettings: Partial<UpdateForsightManagerSettings>): UpdatedManagerSetting[] {
    this.validateSettings(newSettings)
    return this.changeTracker.updateSettings(this.settings, newSettings)
  }
  
  get(): Readonly<ForesightManagerSettings> {
    return { ...this.settings }
  }
  
  private getDefaultSettings(): ForesightManagerSettings {
    return {
      debug: false,
      enableMousePrediction: DEFAULT_ENABLE_MOUSE_PREDICTION,
      enableScrollPrediction: DEFAULT_ENABLE_SCROLL_PREDICTION,
      enableTabPrediction: DEFAULT_ENABLE_TAB_PREDICTION,
      trajectoryPredictionTime: DEFAULT_TRAJECTORY_PREDICTION_TIME,
      positionHistorySize: DEFAULT_POSITION_HISTORY_SIZE,
      tabOffset: DEFAULT_TAB_OFFSET,
      scrollMargin: DEFAULT_SCROLL_MARGIN,
    }
  }
}
```

## **Separation of Concerns**

### 1. **Separate Event Handling from Prediction**
**Problem:** Predictors handle both event listening and prediction logic

**Solution:**
```typescript
abstract class EventHandler {
  protected abortController = new AbortController()
  
  abstract setupListeners(): void
  
  cleanup(): void {
    this.abortController.abort()
  }
  
  protected get signal(): AbortSignal {
    return this.abortController.signal
  }
}

abstract class Predictor {
  abstract predict(data: any): PredictionResult | null
  abstract isEnabled(): boolean
}

class MouseEventHandler extends EventHandler {
  constructor(private predictor: MousePredictor) {
    super()
  }
  
  setupListeners(): void {
    document.addEventListener('mousemove', this.handleMouseMove, { signal: this.signal })
    document.addEventListener('mouseenter', this.handleMouseEnter, { signal: this.signal })
    document.addEventListener('mouseleave', this.handleMouseLeave, { signal: this.signal })
  }
  
  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.predictor.isEnabled()) return
    
    this.predictor.predict({
      x: e.clientX,
      y: e.clientY,
      timestamp: performance.now(),
      target: e.target
    })
  }
}
```

### 2. **Dependency Injection for Testability**
**Problem:** Hard-to-test singleton pattern

**Solution:**
```typescript
interface ManagerDependencies {
  mousePredictor: MousePredictor
  tabPredictor: TabPredictor
  scrollPredictor: ScrollPredictor
  elementRegistry: ElementRegistry
  settingsManager: SettingsManager
  eventEmitter: TypedEventEmitter<ForesightEventMap>
}

function createDefaultDependencies(): ManagerDependencies {
  const elementRegistry = new ElementRegistry()
  const settingsManager = new SettingsManager()
  const eventEmitter = new TypedEventEmitter<ForesightEventMap>()
  
  return {
    mousePredictor: new MousePredictor(/* dependencies */),
    tabPredictor: new TabPredictor(/* dependencies */),
    scrollPredictor: new ScrollPredictor(/* dependencies */),
    elementRegistry,
    settingsManager,
    eventEmitter,
  }
}

class ForesightManager {
  private dependencies: ManagerDependencies
  
  constructor(dependencies: ManagerDependencies = createDefaultDependencies()) {
    this.dependencies = dependencies
    this.initialize()
  }
  
  static instance: ForesightManager | null = null
  
  static getInstance(): ForesightManager {
    if (!this.instance) {
      this.instance = new ForesightManager()
    }
    return this.instance
  }
  
  // For testing
  static resetInstance(): void {
    this.instance = null
  }
}
```

## **Documentation Standards**

### 1. **Comprehensive JSDoc**
**Problem:** Inconsistent documentation across methods

**Solution:**
```typescript
/**
 * Registers an element for foresight prediction tracking.
 * 
 * @param options - Configuration options for the element
 * @param options.element - The HTML element to track
 * @param options.callback - Function to call when prediction triggers
 * @param options.hitSlop - Optional expansion area around the element (pixels or Rect)
 * @param options.name - Optional name for debugging and identification
 * 
 * @returns Registration result containing element data and cleanup function
 * 
 * @throws {Error} When element is not connected to DOM
 * @throws {Error} When callback is not a function
 * @throws {Error} When hitSlop is invalid
 * 
 * @example
 * ```typescript
 * const result = manager.register({
 *   element: document.getElementById('button'),
 *   callback: () => console.log('Predicted interaction'),
 *   hitSlop: 10,
 *   name: 'main-button'
 * });
 * 
 * // Later, cleanup when component unmounts
 * result.unregister();
 * ```
 */
public register(options: ForesightRegisterOptions): ForesightRegisterResult
```

### 2. **Type Documentation**
**Problem:** Complex types lack documentation

**Solution:**
```typescript
/**
 * Configuration options for registering an element with ForesightJS.
 * 
 * @example
 * ```typescript
 * const options: ForesightRegisterOptions = {
 *   element: buttonElement,
 *   callback: () => loadData(),
 *   hitSlop: { top: 10, left: 10, right: 10, bottom: 10 },
 *   name: 'load-button'
 * };
 * ```
 */
interface ForesightRegisterOptions {
  /** The HTML element to track for predictions */
  element: ForesightElement
  
  /** Function to execute when prediction triggers */
  callback: ForesightCallback
  
  /** 
   * Optional expansion area around element bounds.
   * Can be a number (pixels) or Rect object for asymmetric expansion.
   */
  hitSlop?: number | Rect
  
  /** Optional name for debugging and identification */
  name?: string
}
```

## **Implementation Priority**

### **High Priority (Immediate)**
1. Extract generic setting update helper
2. Add comprehensive input validation
3. Standardize error handling patterns
4. Split complex constructors

### **Medium Priority (Next Sprint)**
1. Implement type-safe event system
2. Extract ElementRegistry and SettingsManager
3. Separate event handling from prediction logic
4. Add comprehensive JSDoc documentation

### **Low Priority (Future)**
1. Implement dependency injection for testability
2. Add performance monitoring and metrics
3. Create configuration object hierarchy
4. Add advanced validation with custom error types

## **Testing Strategy**

### **Unit Testing Structure**
```typescript
describe('ForesightManager', () => {
  let manager: ForesightManager
  let mockDependencies: MockManagerDependencies
  
  beforeEach(() => {
    mockDependencies = createMockDependencies()
    manager = new ForesightManager(mockDependencies)
  })
  
  describe('register', () => {
    it('should validate element connection', () => {
      const disconnectedElement = document.createElement('div')
      
      expect(() => {
        manager.register({
          element: disconnectedElement,
          callback: () => {}
        })
      }).toThrow('Element must be connected to the DOM')
    })
    
    it('should register element with correct data', () => {
      const element = document.createElement('div')
      document.body.appendChild(element)
      
      const result = manager.register({
        element,
        callback: () => 'test',
        name: 'test-element'
      })
      
      expect(result.elementData.name).toBe('test-element')
      expect(mockDependencies.elementRegistry.has(element)).toBe(true)
    })
  })
})
```

These clean code improvements will make the ForesightJS codebase significantly more maintainable, testable, and easier to understand while preserving all existing functionality.