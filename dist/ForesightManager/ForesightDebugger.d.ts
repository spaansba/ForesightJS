import type { ForesightManager } from "./ForesightManager";
import type { ElementData, ForesightElement, ForesightManagerProps, Point } from "../types/types";
export declare class ForesightDebugger {
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
    initialize(links: Map<ForesightElement, ElementData>, currentSettings: ForesightManagerProps, currentPoint: Point, predictedPoint: Point): void;
    cleanup(): void;
    createOrUpdateLinkOverlay(element: ForesightElement, elementData: ElementData): void;
    removeLinkOverlay(element: ForesightElement): void;
    updateAllLinkVisuals(links: Map<ForesightElement, ElementData>): void;
    updateTrajectoryVisuals(currentPoint: Point, predictedPoint: Point, enableMouseTrajectory: boolean): void;
    private createDebugControls;
    updateControlsState(settings: ForesightManagerProps): void;
}
