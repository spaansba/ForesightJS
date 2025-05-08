export type Rect = {
    top: number;
    left: number;
    right: number;
    bottom: number;
};
export type IntentCallback = () => void;
export type LinkElement = Element;
export type MousePosition = {
    point: Point;
    time: number;
};
export type Point = {
    x: number;
    y: number;
};
export type LinkData = {
    callback: IntentCallback;
    expandedRect: Rect | null;
    isHovering: boolean;
    isTrajectoryHit: boolean;
    trajectoryHitTime: number;
};
export type IntentManagerProps = {
    positionHistorySize: number;
    trajectoryPredictionTime: number;
    enableMouseTrajectory: boolean;
    debug: boolean;
};
