const isElement = (element?: unknown): element is Element =>
  (isNode(element) && element.nodeType === 1) || false

type NodeObject = object & { nodeType: number }

const isNode = (node?: unknown): node is Node =>
  (isObject(node) &&
    typeof (node as NodeObject).nodeType === "number" &&
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].some((x) => (node as NodeObject).nodeType === x)) ||
  false

export type Fn = (...args: unknown[]) => unknown
const isObject = (obj?: unknown): obj is object =>
  (obj !== null && obj !== undefined && typeof obj === "object") || false

const isFunction = (fn?: unknown): fn is Fn => typeof fn === "function" || false

export type PositionObserverEntry = IntersectionObserverEntry & {
  intersectionChange: "entered" | "exited" | "none"
}

export type PositionObserverCallback = (
  entries: IntersectionObserverEntry[],
  observer: PositionObserver
) => void

const callbackModes = ["all", "intersecting", "update"] as const
type CallbackMode = (typeof callbackModes)[number]
type CallbackModeIndex = 0 | 1 | 2

export type PositionObserverOptions = {
  root?: Element // PositionObserver root only, IntersectionObserver root is always the document
  rootMargin?: IntersectionObserverInit["rootMargin"]
  threshold?: IntersectionObserverInit["threshold"]
  callbackMode?: CallbackMode
}

const errorString = "PositionObserver Error"

/**
 * The PositionObserver class is a utility class that observes the position
 * of DOM elements and triggers a callback when their position changes.
 */
export default class PositionObserver {
  public entries: Map<Element, IntersectionObserverEntry>
  /** `PositionObserver.tick` */
  protected _t: number
  /** `PositionObserver.root` */
  protected _r: Element
  /** `PositionObserver.callbackMode` */
  protected _cm: CallbackModeIndex
  /** `PositionObserver.root.clientWidth` */
  protected _w: number
  /** `PositionObserver.root.clientHeight` */
  protected _h: number
  /** `IntersectionObserver.options.rootMargin` */
  protected _rm: string | undefined
  /** `IntersectionObserver.options.threshold` */
  protected _th: number | number[] | undefined
  /** `PositionObserver.callback` */
  protected _c: PositionObserverCallback

  /**
   * The constructor takes two arguments, a `callback`, which is called
   * whenever the position of an observed element changes and an `options` object.
   * The callback function takes an array of `PositionObserverEntry` objects
   * as its only argument, but it's not required.
   *
   * @param callback the callback that applies to all targets of this observer
   * @param options the options of this observer
   */
  constructor(callback: PositionObserverCallback, options?: PositionObserverOptions) {
    if (!isFunction(callback)) {
      throw new Error(`${errorString}: ${callback} is not a function.`)
    }
    this.entries = new Map<Element, IntersectionObserverEntry>()
    this._c = callback
    this._t = 0
    const root = isElement(options?.root)
      ? options.root
      : /* istanbul ignore next @preserve */
        document?.documentElement
    this._r = root
    this._rm = options?.rootMargin
    this._th = options?.threshold
    /* istanbul ignore next @preserve */
    this._cm = callbackModes.indexOf(options?.callbackMode || "intersecting") as CallbackModeIndex
    this._w = root.clientWidth
    this._h = root.clientHeight
  }

  /**
   * Start observing the position of the specified element.
   * If the element is not currently attached to the DOM,
   * it will NOT be added to the entries.
   *
   * @param target an `Element` target
   */
  public observe = (target: Element) => {
    if (!isElement(target)) {
      throw new Error(`${errorString}: ${target} is not an instance of Element.`)
    }

    /* istanbul ignore else @preserve - a guard must be set */
    if (!this._r.contains(target)) return

    // define a new entry
    // push the entry into the queue
    this._n(target).then((ioEntry) => {
      /* istanbul ignore else @preserve - don't allow duplicate entries */
      if (ioEntry.boundingClientRect && !this.getEntry(target)) {
        this.entries.set(target, ioEntry)

        // this._c([ioEntry], this)
      }

      /* istanbul ignore else @preserve */
      if (!this._t) this._t = requestAnimationFrame(this._rc)
    })
  }

  /**
   * Stop observing the position of the specified element.
   *
   * @param target an `Element` target
   */
  public unobserve = (target: Element) => {
    /* istanbul ignore else @preserve */
    if (this.entries.has(target)) this.entries.delete(target)
  }

  /**
   * Private method responsible for all the heavy duty,
   * the observer's runtime.
   * `PositionObserver.runCallback`
   */
  protected _rc = () => {
    /* istanbul ignore if @preserve - a guard must be set */
    if (!this.entries.size) {
      this._t = 0
      return
    }
    const { clientWidth, clientHeight } = this._r

    const queue = new Promise<IntersectionObserverEntry[]>((resolve) => {
      const updates: IntersectionObserverEntry[] = []
      this.entries.forEach(
        ({ target, boundingClientRect: oldBoundingBox, isIntersecting: oldIsIntersecting }) => {
          /* istanbul ignore if @preserve - a guard must be set when target has been removed */
          if (!this._r.contains(target)) return

          this._n(target).then((ioEntry) => {
            /* istanbul ignore if @preserve - make sure to only count visible entries */
            if (!ioEntry.isIntersecting) {
              if (this._cm === 1) {
                // 1
                return
              } else if (this._cm === 2) {
                if (oldIsIntersecting) {
                  this.entries.set(target, ioEntry)
                  updates.push(ioEntry)
                }
                return
              }
            }
            const { left, top } = ioEntry.boundingClientRect
            /* istanbul ignore else @preserve - only schedule entries that changed position */
            if (
              oldBoundingBox.top !== top ||
              oldBoundingBox.left !== left ||
              this._w !== clientWidth ||
              this._h !== clientHeight
            ) {
              this.entries.set(target, ioEntry)
              updates.push(ioEntry)
            }
          })
        }
      )
      // update root client width & height
      this._w = clientWidth
      this._h = clientHeight

      resolve(updates)
    })

    this._t = requestAnimationFrame(async () => {
      // execute the queue
      const updates = await queue

      // only execute the callback if position actually changed
      /* istanbul ignore else @preserve */
      if (updates.length) this._c(updates, this)

      this._rc()
    })
  }

  /**
   * Check intersection status and resolve it
   * right away.
   *
   * `PositionObserver.newEntryForTarget`
   *
   * @param target an `Element` target
   */
  protected _n = (target: Element) => {
    return new Promise<IntersectionObserverEntry>((resolve) => {
      const intersectionObserver = new IntersectionObserver(
        ([ioEntry], ob) => {
          ob.disconnect()
          resolve(ioEntry)
        },
        {
          // IntersectionObserver.root is always the document
          // root: target.ownerDocument || document,
          threshold: this._th,
          rootMargin: this._rm,
        }
      )

      intersectionObserver.observe(target)
    })
  }

  /**
   * Find the entry for a given target.
   *
   * @param target an `HTMLElement` target
   */
  public getEntry = (target: Element) => this.entries.get(target)

  /**
   * Immediately stop observing all elements.
   */
  public disconnect = () => {
    console.log("disconnecting")
    cancelAnimationFrame(this._t)
    this.entries.clear()
    this._t = 0
  }
}
