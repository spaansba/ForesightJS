import type {
  CallbackHitType,
  ElementBounds,
  ForesightElement,
  ForesightElementInternal,
  ForesightElementState,
  ForesightEvent,
  ForesightEventMap,
  ForesightManagerSettings,
} from "../types/types"

type CallCallbackFunction = (
  entry: ForesightElementInternal,
  callbackHitType: CallbackHitType
) => void

type EmitFunction = <K extends ForesightEvent>(event: ForesightEventMap[K]) => void

export type HasListenersFunction = <K extends ForesightEvent>(eventType: K) => boolean

type UpdateElementStateFunction = (
  entry: ForesightElementInternal,
  patch: Partial<ForesightElementState>
) => ForesightElementState

type UpdateElementBoundsFunction = (
  entry: ForesightElementInternal,
  next: ElementBounds
) => ElementBounds

export type ForesightModuleDependencies = {
  elements: ReadonlyMap<ForesightElement, ForesightElementInternal>
  /** Precomputed subset of {@link elements} that the mouse trajectory scan iterates. */
  scannableElements: ReadonlySet<ForesightElementInternal>
  callCallback: CallCallbackFunction
  emit: EmitFunction
  hasListeners: HasListenersFunction
  updateElementState: UpdateElementStateFunction
  updateElementBounds: UpdateElementBoundsFunction
  settings: ForesightManagerSettings
}

export abstract class BaseForesightModule {
  protected abortController = new AbortController()
  private _isConnected = false

  constructor(protected readonly deps: ForesightModuleDependencies) {}

  public get isConnected(): boolean {
    return this._isConnected
  }

  public disconnect(): void {
    if (!this.isConnected) {
      return
    }

    this.abortController.abort()
    this.onDisconnect()
    this._isConnected = false
  }

  public connect(): void {
    if (this.isConnected) {
      return
    }

    this._isConnected = true
    this.abortController = new AbortController()
    this.onConnect()
  }

  protected onConnect(): void {}
  protected onDisconnect(): void {}
}
