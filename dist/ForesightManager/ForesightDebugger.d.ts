import type { ForesightManager } from "./ForesightManager";
import type { LinkElement, Point, Rect } from "../types/types";
type LinkManagerData = {
    callback: () => void;
    expandedRect: Rect | null;
    isHovering: boolean;
    isTrajectoryHit: boolean;
    trajectoryHitTime: number;
};
export declare class IntentDebugger {
    private foresightManagerInstance;
    private shadowHost;
    private shadowRoot;
    private debugContainer;
    private debugLinkOverlays;
    private debugPredictedMouseIndicator;
    private debugTrajectoryLine;
    private debugControlsContainer;
    private debugStyleElement;
    constructor(intentManager: ForesightManager);
    initialize(links: Map<LinkElement, LinkManagerData>, currentSettings: {
        positionHistorySize: number;
        trajectoryPredictionTime: number;
        enableMouseTrajectory: boolean;
    }, currentPoint: Point, predictedPoint: Point): void;
    cleanup(): void;
    createOrUpdateLinkOverlay(element: LinkElement, linkData: LinkManagerData): void;
    removeLinkOverlay(element: LinkElement): void;
    updateAllLinkVisuals(links: Map<LinkElement, LinkManagerData>): void;
    updateTrajectoryVisuals(currentPoint: Point, predictedPoint: Point, enableMouseTrajectory: boolean): void;
    private createDebugControls;
    updateControlsState(settings: {
        positionHistorySize: number;
        trajectoryPredictionTime: number;
        enableMouseTrajectory: boolean;
    }): void;
}
export {};
