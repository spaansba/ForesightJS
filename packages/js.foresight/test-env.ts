class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

if (typeof window !== "undefined") {
  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) satisfies MediaQueryList
  globalThis.ResizeObserver ??= NoopObserver
  globalThis.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver
}
