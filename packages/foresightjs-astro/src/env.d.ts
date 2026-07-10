declare module "astro:prefetch" {
  export type PrefetchOptions = {
    ignoreSlowConnection?: boolean
    eagerness?: "immediate" | "eager" | "moderate" | "conservative"
  }
  export function prefetch(url: string, options?: PrefetchOptions): void
}

declare module "*.astro" {
  const Component: (props: Record<string, unknown>) => unknown
  export default Component
}
