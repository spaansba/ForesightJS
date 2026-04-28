import type { ForesightElement } from "../types/types"
import { BaseForesightModule } from "./BaseForesightModule"

/**
 * Abstract base for modules that observe and unobserve individual elements.
 *
 * Declaring these methods on a shared base lets the manager call them through
 * a single type (e.g. `currentlyActiveHandler.observeElement(el)`) while still
 * keeping each subclass responsible for its own observation strategy
 * (PositionObserver, IntersectionObserver, pointerdown listeners, etc.).
 */
export abstract class ElementObservingModule extends BaseForesightModule {
  public abstract observeElement(element: ForesightElement): void
  public abstract unobserveElement(element: ForesightElement): void
}
