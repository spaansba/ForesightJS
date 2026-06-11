import { devLogMessage } from "../helpers/devLog"
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
  callCallback: CallCallbackFunction
  emit: EmitFunction
  hasListeners: HasListenersFunction
  updateElementState: UpdateElementStateFunction
  updateElementBounds: UpdateElementBoundsFunction
  settings: ForesightManagerSettings
}

export abstract class BaseForesightModule {
  protected abortController?: AbortController
  protected elements: ReadonlyMap<ForesightElement, ForesightElementInternal>
  protected callCallback: CallCallbackFunction
  protected emit: EmitFunction
  protected hasListeners: HasListenersFunction
  protected updateElementState: UpdateElementStateFunction
  protected updateElementBounds: UpdateElementBoundsFunction
  protected settings: ForesightManagerSettings
  private _isConnected = false

  public get isConnected(): boolean {
    return this._isConnected
  }

  protected abstract readonly moduleName: string // Name of the implementor class for debugging purposes

  constructor(dependencies: ForesightModuleDependencies) {
    this.elements = dependencies.elements
    this.callCallback = dependencies.callCallback
    this.emit = dependencies.emit
    this.hasListeners = dependencies.hasListeners
    this.updateElementState = dependencies.updateElementState
    this.updateElementBounds = dependencies.updateElementBounds
    this.settings = dependencies.settings
  }

  public disconnect(): void {
    if (!this.isConnected) {
      return
    }

    this.devLog(`Disconnecting ${this.moduleName}...`)
    this.abortController?.abort(`${this.moduleName} module disconnected`)
    this.onDisconnect()
    this._isConnected = false
  }

  public connect(): void {
    if (this.isConnected) {
      return
    }

    this.devLog(`Connecting ${this.moduleName}...`)
    this.onConnect()
    this._isConnected = true
  }

  public devLog(message: string): void {
    if (!this.settings.enableManagerLogging) {
      return
    }

    const color = this.moduleName.includes("Predictor") ? "#ea580c" : "#2563eb"
    devLogMessage(this.moduleName, message, color)
  }

  protected abstract onConnect(): void
  protected abstract onDisconnect(): void

  protected createAbortController(): void {
    if (this.abortController && !this.abortController.signal.aborted) {
      return
    }

    this.abortController = new AbortController()

    this.devLog(`Created new AbortController for ${this.moduleName}`)
  }
}
