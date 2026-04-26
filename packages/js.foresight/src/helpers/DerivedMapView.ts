/**
 * Read-only map that exposes external state derived from internal state,
 * so internals are never leaked to consumers.
 */
export class DerivedMapView<K, TSource, TDerived> implements ReadonlyMap<K, TDerived> {
  constructor(
    private source: Map<K, TSource>,
    private derive: (value: TSource) => TDerived
  ) {}

  get size() {
    return this.source.size
  }

  get(key: K): TDerived | undefined {
    const entry = this.source.get(key)

    return entry === undefined ? undefined : this.derive(entry)
  }

  has(key: K): boolean {
    return this.source.has(key)
  }

  forEach(cb: (value: TDerived, key: K, map: ReadonlyMap<K, TDerived>) => void): void {
    this.source.forEach((entry, key) => cb(this.derive(entry), key, this))
  }

  *entries(): MapIterator<[K, TDerived]> {
    for (const [key, entry] of this.source) {
      yield [key, this.derive(entry)]
    }
  }

  *values(): MapIterator<TDerived> {
    for (const entry of this.source.values()) {
      yield this.derive(entry)
    }
  }

  keys(): MapIterator<K> {
    return this.source.keys()
  }

  [Symbol.iterator](): MapIterator<[K, TDerived]> {
    return this.entries()
  }

  get [Symbol.toStringTag](): string {
    return "DerivedMapView"
  }
}
