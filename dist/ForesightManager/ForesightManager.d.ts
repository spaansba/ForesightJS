import type { IntentCallback, IntentManagerProps, LinkElement } from "../types/types";
export declare class ForesightManager {
    private static instance;
    private links;
    private isSetup;
    private debugMode;
    private debugger;
    private positionHistorySize;
    private trajectoryPredictionTime;
    private positions;
    private enableMouseTrajectory;
    private currentPoint;
    private predictedPoint;
    private lastResizeScrollCallTimestamp;
    private resizeScrollThrottleTimeoutId;
    private readonly resizeScrollThrottleDelay;
    private constructor();
    static initialize(props?: Partial<IntentManagerProps>): ForesightManager;
    static getInstance(): ForesightManager;
    private checkTrajectoryHitExpiration;
    register(element: LinkElement, callback: IntentCallback): () => void;
    private unregister;
    setTrajectorySettings(settings: {
        historySize?: number;
        predictionTime?: number;
        enabled?: boolean;
    }): void;
    private turnOnDebugMode;
    private getExpandedRect;
    private updateExpandedRect;
    private updateAllRects;
    private predictMousePosition;
    private pointIntersectsRect;
    private isMouseInExpandedArea;
    private handleMouseMove;
    private handleResizeOrScroll;
    private setupGlobalListeners;
    private removeGlobalListeners;
}
