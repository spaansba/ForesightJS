import PositionObserver, {
  type PositionObserverCallback,
  type PositionObserverOptions,
} from "@thednp/position-observer"

/**
 * The PositionObserverExtended class extends the base PositionObserver
 * to include intersection status in its observation logic. It triggers
 * the callback not only when an element's position changes but also when
 * it enters or leaves the viewport.
 */
export default class PositionObserverExtended extends PositionObserver {
  constructor(callback: PositionObserverCallback, options?: Partial<PositionObserverOptions>) {
    super(callback, options)
    this._w = 0
  }
  public observe = (target: Element) => {
    if (!this._r.contains(target)) return

    this._n(target).then((ioEntry) => {
      if (ioEntry.boundingClientRect && !this.getEntry(target)) {
        this.entries.set(target, ioEntry)
        // We run the callback on observe, this is the only reason we create the extended observer
      }
      if (!this._t) this._t = requestAnimationFrame(this._rc)
    })
  }
}
