type Rect = {
    top: number;
    left: number;
    right: number;
    bottom: number;
};
/**
 * A callback function that is executed when a foresight interaction
 * (e.g., hover, trajectory hit) occurs on a registered element.
 * Only triggers ones per interaction
 */
type ForesightCallback = () => void;
/**
 * Represents the HTML element that is being tracked by the ForesightManager.
 * This is typically a standard DOM `Element`.
 */
type ForesightElement = Element;
/**
 * Configuration options for the ForesightManager
 */
type ForesightManagerProps = {
    /**
     * Number of mouse positions to keep in history for trajectory calculation.
     * A higher number might lead to smoother but slightly delayed predictions.
     * @default 8
     */
    positionHistorySize: number;
    /**
     * How far ahead (in milliseconds) to predict the mouse trajectory.
     * A larger value means the prediction extends further into the future. (meaning it will trigger callbacks sooner)
     * @default 80
     */
    trajectoryPredictionTime: number;
    /**
     * Whether to enable mouse trajectory prediction.
     * If false, only direct hover/interaction is considered.
     * @default true
     */
    enableMousePrediction: boolean;
    /**
     * Whether to show visual debugging information on the screen.
     * This includes overlays for elements, hit slop areas, and the predicted mouse path.
     * @default false
     */
    debug: boolean;
    /**
     * Default hit slop to apply to all registered elements if no specific
     * hit slop is provided during registration.
     * Can be a single number for uniform slop on all sides, or a Rect object
     * for different values per side.
     * @default { top: 0, left: 0, right: 0, bottom: 0 }
     */
    defaultHitSlop: Rect | number;
    /**
     * Amount of time in ms the element bounds get recalculated on scroll/resize of the page.
     * @default 50
     */
    resizeScrollThrottleDelay: number;
};

/**
 * Manages the prediction of user intent based on mouse trajectory and element interactions.
 *
 * ForesightManager is a singleton class responsible for:
 * - Registering HTML elements to monitor.
 * - Tracking mouse movements and predicting future cursor positions.
 * - Detecting when a predicted trajectory intersects with a registered element's bounds.
 * - Invoking callbacks associated with elements upon predicted or actual interaction.
 * - Handling global settings for prediction behavior (e.g., history size, prediction time).
 * - Optionally enabling a {@link ForesightDebugger} for visual feedback.
 *
 * It should be initialized once using {@link ForesightManager.initialize} and then
 * accessed via the static getter {@link ForesightManager.instance}.
 */
declare class ForesightManager {
    private static manager;
    private links;
    private isSetup;
    private debugMode;
    private debugger;
    private globalSettings;
    private positions;
    private currentPoint;
    private predictedPoint;
    private lastResizeScrollCallTimestamp;
    private resizeScrollThrottleTimeoutId;
    private constructor();
    /**
     * Initializes the ForesightManager singleton instance with optional global settings.
     *
     * This method sets up the manager, applying any provided configuration. If the manager
     * is already initialized and this method is called again with new props, it will
     * log an error and apply the new settings using `alterGlobalSettings`.
     * It's recommended to call this method only once at the application's entry point.
     *
     * If `props.debug` is true or becomes true, the {@link ForesightDebugger} will be initialized or updated.
     *
     * @param {Partial<ForesightManagerProps>} [props] - Optional initial global settings
     *        to configure the manager. See {@link ForesightManagerProps} for details.
     * @returns {ForesightManager} The singleton instance of the ForesightManager.
     */
    static initialize(props?: Partial<ForesightManagerProps>): ForesightManager;
    /**
     * Gets the singleton instance of the ForesightManager.
     *
     * If the manager has not been initialized yet, this getter will call
     * {@link ForesightManager.initialize} with default settings to create the instance.
     *
     * @returns {ForesightManager} The singleton instance of the ForesightManager.
     */
    static get instance(): ForesightManager;
    private checkTrajectoryHitExpiration;
    private normalizeHitSlop;
    /**
     * Registers an element with the ForesightManager to monitor for predicted interactions.
     *
     * @param element The HTML element to monitor.
     * @param callback The function to execute when an interaction is predicted or occurs.
     *                 (Corresponds to {@link ForesightElementConfig.callback})
     * @param hitSlop Optional. The amount of "slop" to add to the element's bounding box
     *                for hit detection. Can be a single number or a Rect object.
     *                This will overwrite the default global hitSlop set by the initializer of foresight.
     * @param name Optional. A descriptive name for the element, useful for debugging.
     *             Defaults to "Unnamed".
     * @returns A function to unregister the element.
     */
    register(element: ForesightElement, callback: ForesightCallback, hitSlop?: number | Rect, name?: string): () => void;
    private unregister;
    /**
     * Alters the global settings of the ForesightManager at runtime.
     *
     * This method allows dynamic updates to global configuration properties such as
     * prediction parameters (`positionHistorySize`, `trajectoryPredictionTime`),
     * `defaultHitSlop`, `debug` mode, and more.
     *
     * While global settings are typically best configured once via
     * {@link ForesightManager.initialize} at the application's start, this method
     * provides a way to modify them post-initialization. It is notably used by the
     * {@link ForesightDebugger} UI to allow real-time adjustments for testing and
     * tuning prediction behavior.
     *
     * For element-specific configurations (like an individual element's `hitSlop` or `name`),
     * those should be provided during the element's registration via the
     * {@link ForesightManager.register} method.
     *
     * If debug mode is active (`globalSettings.debug` is true) and any settings
     * that affect the debugger's display or controls are changed, the
     * {@link ForesightDebugger} instance will be updated accordingly.
     *
     * @param {Partial<ForesightManagerProps>} [props] - An object containing the global
     *        settings to update. Only properties provided in this object will be changed.
     *        See {@link ForesightManagerProps} for available settings.
     */
    alterGlobalSettings(props?: Partial<ForesightManagerProps>): void;
    private turnOnDebugMode;
    private getExpandedRect;
    private updateExpandedRect;
    private updateAllRects;
    private predictMousePosition;
    /**
     * Checks if a line segment intersects with an axis-aligned rectangle.
     * Uses the Liang-Barsky line clipping algorithm.
     * @param p1 Start point of the line segment.
     * @param p2 End point of the line segment.
     * @param rect The rectangle to check against.
     * @returns True if the line segment intersects the rectangle, false otherwise.
     */
    private lineSegmentIntersectsRect;
    private isMouseInExpandedArea;
    private handleMouseMove;
    private handleResizeOrScroll;
    private setupGlobalListeners;
    private removeGlobalListeners;
}

export { ForesightManager };
export type { ForesightCallback, ForesightElement, ForesightManagerProps, Rect as ForesightRect };
