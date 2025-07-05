import type { ForesightManager } from "js.foresight"
import type { ForesightDebugger } from "../../debugger/ForesightDebugger"

/**
 * @abstract
 * @class BaseTab
 * @description
 * An abstract base class that serves as a blueprint for all UI tabs within the control panel.
 * It establishes a common contract that all concrete tab implementations must follow,
 * ensuring consistent lifecycle methods and behavior.
 *
 * This class also handles the dependency injection of shared services like
 * `ForesightManager` and `ForesightDebugger`, making them available to all subclasses.
 */
export abstract class BaseTab {
  /**
   * The shared instance of the ForesightManager .
   * Available to all subclasses for interacting with core foresight logic.
   * @protected
   * @type {ForesightManager}
   */
  protected foresightManagerInstance: ForesightManager

  /**
   * The shared instance of the ForesightDebugger.
   * Available to all subclasses for accessing debugger data and settings.
   * @protected
   * @type {ForesightDebugger}
   */
  protected debuggerInstance: ForesightDebugger

  /**
   * Creates an instance of a BaseTab.
   * @param {ForesightManager} foresightManager The singleton instance of the ForesightManager.
   * @param {ForesightDebugger} debuggerInstance The singleton instance of the ForesightDebugger.
   */
  constructor(foresightManager: ForesightManager, debuggerInstance: ForesightDebugger) {
    this.foresightManagerInstance = foresightManager
    this.debuggerInstance = debuggerInstance
  }

  /**
   * Initializes the tab's functionality. This is the main entry point for a tab's lifecycle.
   * A concrete implementation should use this method to call internal setup methods
   * like `queryDOMElements` and `setupEventListeners`.
   */
  public abstract initialize(controlsContainer: HTMLElement): void

  /**
   * Cleans up all resources used by the tab to prevent memory leaks.
   * This method MUST be implemented by any subclass to remove event listeners,
   * clear intervals, and nullify references when the tab is destroyed or hidden.
   */
  public abstract cleanup(): void

  /**
   * Queries the DOM for all necessary elements required by the tab and caches them as class properties.
   * This method is intended to be called from within the `initialize` method.
   */
  protected abstract queryDOMElements(controlsContainer: HTMLElement): void

  /**
   * Sets up all necessary event listeners for the tab's interactive elements.
   * This method is intended to be called from within the `initialize` method after
   * DOM elements have been queried.
   */
  protected abstract setupEventListeners(): void
}
