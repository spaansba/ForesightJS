import type { CallbackHitType } from "js.foresight"

type SubTypeCounts<K extends CallbackHitType["kind"]> = Record<
  NonNullable<Extract<CallbackHitType, { kind: K }>["subType"]>,
  number
>

export type CallbackHits = {
  total: number
  mouse: SubTypeCounts<"mouse">
  tab: SubTypeCounts<"tab">
  scroll: SubTypeCounts<"scroll">
  touch: number
  viewport: number
}

export const createCallbackHits = (): CallbackHits => ({
  total: 0,
  mouse: { hover: 0, trajectory: 0 },
  tab: { forwards: 0, reverse: 0 },
  scroll: { up: 0, down: 0, left: 0, right: 0 },
  touch: 0,
  viewport: 0,
})

export const countCallbackHit = (hits: CallbackHits, hitType: CallbackHitType): void => {
  hits.total++
  switch (hitType.kind) {
    case "mouse":
      hits.mouse[hitType.subType]++
      break
    case "tab":
      hits.tab[hitType.subType]++
      break
    case "scroll":
      hits.scroll[hitType.subType]++
      break
    case "touch":
    case "viewport":
      hits[hitType.kind]++
      break
    default:
      hitType satisfies never
  }
}
