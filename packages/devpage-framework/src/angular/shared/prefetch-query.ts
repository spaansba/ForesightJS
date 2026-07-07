import { signal, type Signal, type WritableSignal } from "@angular/core"

/**
 * Tiny signal-backed query cache — the Angular stand-in for the React demo's
 * TanStack Query usage on the Home page. Enough to show prefetch-on-predict:
 * a foresight callback warms the cache, so the later click resolves instantly.
 */
export type QueryState<T> = {
  data: T | undefined
  isFetching: boolean
  isStale: boolean
  updatedAt: number
  fetchCount: number
  error: unknown
}

const initialState = <T>(): QueryState<T> => ({
  data: undefined,
  isFetching: false,
  isStale: false,
  updatedAt: 0,
  fetchCount: 0,
  error: null,
})

class QueryCache {
  private readonly store = new Map<string, WritableSignal<QueryState<unknown>>>()
  private readonly inflight = new Map<string, Promise<unknown>>()
  private readonly staleTimers = new Map<string, ReturnType<typeof setTimeout>>()

  private entry<T>(key: string): WritableSignal<QueryState<T>> {
    let entry = this.store.get(key)
    if (!entry) {
      entry = signal(initialState<unknown>())
      this.store.set(key, entry)
    }

    return entry as WritableSignal<QueryState<T>>
  }

  state<T>(key: string): Signal<QueryState<T>> {
    return this.entry<T>(key).asReadonly()
  }

  private isFresh(key: string, staleTime: number): boolean {
    const entry = this.store.get(key)

    return !!entry && entry().data !== undefined && Date.now() - entry().updatedAt < staleTime
  }

  fetch<T>(
    key: string,
    fn: (fetchCount: number) => Promise<T>,
    options: { staleTime?: number } = {}
  ): Promise<T | undefined> {
    const { staleTime = 0 } = options
    const entry = this.entry<T>(key)

    if (this.isFresh(key, staleTime)) {
      return Promise.resolve(entry().data)
    }

    const existing = this.inflight.get(key)
    if (existing) {
      return existing as Promise<T>
    }

    const fetchCount = entry().fetchCount
    entry.update(state => ({ ...state, isFetching: true, error: null }))

    const promise = fn(fetchCount)
      .then(data => {
        entry.update(state => ({
          ...state,
          data,
          isFetching: false,
          isStale: false,
          updatedAt: Date.now(),
          fetchCount: state.fetchCount + 1,
        }))

        clearTimeout(this.staleTimers.get(key))
        if (staleTime > 0) {
          this.staleTimers.set(
            key,
            setTimeout(() => entry.update(state => ({ ...state, isStale: true })), staleTime)
          )
        }

        return data
      })
      .catch(error => {
        entry.update(state => ({ ...state, isFetching: false, error }))
        throw error
      })
      .finally(() => this.inflight.delete(key))

    this.inflight.set(key, promise)

    return promise
  }

  prefetch<T>(
    key: string,
    fn: (fetchCount: number) => Promise<T>,
    options?: { staleTime?: number }
  ): void {
    void this.fetch(key, fn, options).catch(() => {})
  }
}

export const queryCache = new QueryCache()
