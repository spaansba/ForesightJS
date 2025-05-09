import type { ForesightCallback, ForesightManagerProps, ForesightElement, Rect } from "../types/types";
export declare class ForesightManager {
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
    static initialize(props?: Partial<ForesightManagerProps>): ForesightManager;
    static get instance(): ForesightManager;
    private checkTrajectoryHitExpiration;
    private normalizeHitSlop;
    register(element: ForesightElement, callback: ForesightCallback, hitSlop?: number | Rect): () => void;
    private unregister;
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
