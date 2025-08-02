import type {
  CallbackHitType,
  ForesightElement,
  ForesightElementData,
  ForesightEvent,
  ForesightEventMap,
  ForesightManagerSettings,
} from "../types/types"

export type CallCallbackFunction = (
  elementData: ForesightElementData,
  callbackHitType: CallbackHitType
) => void

export type EmitFunction = <K extends ForesightEvent>(event: ForesightEventMap[K]) => void

export type ForesightModuleDependencies = {
  elements: ReadonlyMap<ForesightElement, ForesightElementData>
  callCallback: CallCallbackFunction
  emit: EmitFunction
  settings: ForesightManagerSettings
}

export abstract class BaseForesightModule {
  protected abortController?: AbortController
  protected elements: ReadonlyMap<ForesightElement, ForesightElementData>
  protected callCallback: CallCallbackFunction
  protected emit: EmitFunction
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
    this.devLog(`Connecting ${this.moduleName}...`)
    this.onConnect()
    this._isConnected = true
  }

  public devLog(message: string): void {
    if (process.env.NODE_ENV === "development") {
      console.log(`🛠️ ${this.moduleName}: ${message}`)
    }
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
