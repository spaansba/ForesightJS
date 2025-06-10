import type { PositionObserverEntry, PositionObserverOptions } from "@thednp/position-observer"
import PositionObserver from "@thednp/position-observer"

const errorString = "PositionObserver Error"

// FIX 1: Self-contained helper function to replace the missing dependency.
const isElement = (el: any): el is Element => {
  return el instanceof Element
}

/**
 * The extended entry type that includes intersection status.
 */
export type PositionObserverExtendedEntry = PositionObserverEntry & {
  isIntersecting: boolean
}

/**
 * The extended callback type that uses the new entry type.
 */
export type PositionObserverExtendedCallback = (
  entries: PositionObserverExtendedEntry[],
  observer: PositionObserverExtended
) => void

/**
 * The PositionObserverExtended class extends the base PositionObserver
 * to include intersection status in its observation logic. It triggers
 * the callback not only when an element's position changes but also when
 * it enters or leaves the viewport.
 */
export default class PositionObserverExtended extends PositionObserver {
  public entries: Map<Element, PositionObserverExtendedEntry>
  protected _callback: PositionObserverExtendedCallback

  constructor(
    callback: PositionObserverExtendedCallback,
    options?: Partial<PositionObserverOptions>
  ) {
    super(callback as any, options)
    this.entries = new Map()
    this._callback = callback
  }

  public observe = (target: Element) => {
    if (!isElement(target)) {
      throw new Error(`${errorString}: ${target} is not an instance of Element.`)
    }
    if (!this._root.contains(target)) return

    // FIX 2: Explicitly type the resolved Promise value.
    this._new(target).then(({ boundingClientRect, isIntersecting }: IntersectionObserverEntry) => {
      if (boundingClientRect && !this.getEntry(target)) {
        const { clientWidth, clientHeight } = this._root

        this.entries.set(target, {
          target,
          boundingClientRect,
          clientWidth,
          clientHeight,
          isIntersecting,
        })
      }

      if (!this._tick) this._tick = requestAnimationFrame(this._runCallback)
    })
  }

  protected _runCallback = () => {
    if (!this.entries.size) {
      this._tick = 0
      return
    }
    const { clientWidth, clientHeight } = this._root

    const queue = new Promise<PositionObserverExtendedEntry[]>((resolve) => {
      const updates: PositionObserverExtendedEntry[] = []
      this.entries.forEach(
        ({
          target,
          boundingClientRect: oldBoundingBox,
          clientWidth: oldWidth,
          clientHeight: oldHeight,
          isIntersecting: oldIsIntersecting,
        }) => {
          if (!this._root.contains(target)) return

          // FIX 3: Explicitly type the resolved Promise value here as well.
          this._new(target).then(
            ({ boundingClientRect, isIntersecting }: IntersectionObserverEntry) => {
              if (!isIntersecting) {
                if (oldIsIntersecting) {
                  const exitEntry: PositionObserverExtendedEntry = {
                    target,
                    boundingClientRect,
                    clientHeight,
                    clientWidth,
                    isIntersecting,
                  }
                  this.entries.set(target, exitEntry)
                  updates.push(exitEntry)
                }
                return
              }

              const { left, top } = boundingClientRect

              if (
                oldBoundingBox.top !== top ||
                oldBoundingBox.left !== left ||
                oldWidth !== clientWidth ||
                oldHeight !== clientHeight ||
                !oldIsIntersecting
              ) {
                const newEntry: PositionObserverExtendedEntry = {
                  target,
                  boundingClientRect,
                  clientHeight,
                  clientWidth,
                  isIntersecting,
                }
                this.entries.set(target, newEntry)
                updates.push(newEntry)
              }
            }
          )
        }
      )

      resolve(updates)
    })

    this._tick = requestAnimationFrame(async () => {
      const updates = await queue
      if (updates.length) this._callback(updates, this)
      this._runCallback()
    })
  }

  public getEntry = (target: Element): PositionObserverExtendedEntry | undefined =>
    this.entries.get(target)
}
