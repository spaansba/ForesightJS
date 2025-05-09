"use client";
import { ForesightDebugger } from "./ForesightDebugger";
export class ForesightManager {
    static instance;
    links = new Map();
    isSetup = false;
    debugMode = false; // Synced with globalSettings.debug
    debugger = null;
    globalSettings = {
        debug: false,
        enableMouseTrajectory: true,
        positionHistorySize: 6,
        trajectoryPredictionTime: 50,
        defaultHitSlop: { top: 0, left: 0, right: 0, bottom: 0 },
        resizeScrollThrottleDelay: 50,
    };
    positions = [];
    currentPoint = { x: 0, y: 0 };
    predictedPoint = { x: 0, y: 0 };
    lastResizeScrollCallTimestamp = 0;
    resizeScrollThrottleTimeoutId = null;
    constructor() {
        // Ensure defaultHitSlop is normalized if it's a number initially
        this.globalSettings.defaultHitSlop = this.normalizeHitSlop(this.globalSettings.defaultHitSlop);
        setInterval(this.checkTrajectoryHitExpiration.bind(this), 100);
    }
    static initialize(props) {
        if (!ForesightManager.instance) {
            ForesightManager.instance = new ForesightManager();
            // Apply initial props, which also handles initial debugger setup
            if (props) {
                ForesightManager.instance.alterGlobalSettings(props);
            }
            else {
                // If no props, but default globalSettings.debug is true, ensure debugger is on
                if (ForesightManager.instance.globalSettings.debug) {
                    ForesightManager.instance.turnOnDebugMode();
                }
            }
        }
        else if (props) {
            // Instance exists, apply new props (handles debugger lifecycle and UI updates)
            ForesightManager.instance.alterGlobalSettings(props);
        }
        // Ensure internal debugMode flag is synced
        ForesightManager.instance.debugMode = ForesightManager.instance.globalSettings.debug;
        return ForesightManager.instance;
    }
    static getInstance() {
        if (!ForesightManager.instance) {
            return this.initialize(); // Initialize with defaults
        }
        return ForesightManager.instance;
    }
    checkTrajectoryHitExpiration() {
        const now = performance.now();
        let needsVisualUpdate = false;
        const updatedForesightElements = [];
        this.links.forEach((elementData, element) => {
            if (elementData.isTrajectoryHit && now - elementData.trajectoryHitTime > 300) {
                this.links.set(element, {
                    ...elementData,
                    isTrajectoryHit: false,
                });
                needsVisualUpdate = true;
                updatedForesightElements.push(element);
            }
        });
        if (needsVisualUpdate && this.debugMode && this.debugger) {
            updatedForesightElements.forEach((element) => {
                const data = this.links.get(element);
                if (data && this.debugger) {
                    this.debugger.createOrUpdateLinkOverlay(element, data);
                }
            });
        }
    }
    normalizeHitSlop = (hitSlop) => {
        if (typeof hitSlop === "number") {
            return {
                top: hitSlop,
                left: hitSlop,
                right: hitSlop,
                bottom: hitSlop,
            };
        }
        return hitSlop;
    };
    register(element, callback, hitSlop) {
        const normalizedHitSlop = hitSlop
            ? this.normalizeHitSlop(hitSlop)
            : this.globalSettings.defaultHitSlop; // Already normalized in constructor/alterGlobalSettings
        const originalRect = element.getBoundingClientRect();
        const newElementData = {
            callback,
            elementBounds: {
                expandedRect: this.getExpandedRect(originalRect, normalizedHitSlop),
                originalRect: originalRect,
                hitSlop: normalizedHitSlop,
            },
            isHovering: false,
            isTrajectoryHit: false,
            trajectoryHitTime: 0,
        };
        this.links.set(element, newElementData);
        this.setupGlobalListeners();
        if (this.debugMode && this.debugger) {
            const data = this.links.get(element);
            if (data)
                this.debugger.createOrUpdateLinkOverlay(element, data);
        }
        return () => this.unregister(element);
    }
    unregister(element) {
        this.links.delete(element);
        if (this.debugMode && this.debugger) {
            this.debugger.removeLinkOverlay(element);
        }
        if (this.links.size === 0 && this.isSetup) {
            this.removeGlobalListeners();
        }
    }
    alterGlobalSettings(props) {
        let settingsActuallyChanged = false;
        if (props?.positionHistorySize !== undefined &&
            this.globalSettings.positionHistorySize !== props.positionHistorySize) {
            this.globalSettings.positionHistorySize = props.positionHistorySize;
            while (this.positions.length > this.globalSettings.positionHistorySize) {
                this.positions.shift();
            }
            settingsActuallyChanged = true;
        }
        if (props?.trajectoryPredictionTime !== undefined &&
            this.globalSettings.trajectoryPredictionTime !== props.trajectoryPredictionTime) {
            this.globalSettings.trajectoryPredictionTime = props.trajectoryPredictionTime;
            settingsActuallyChanged = true;
        }
        if (props?.enableMouseTrajectory !== undefined &&
            this.globalSettings.enableMouseTrajectory !== props.enableMouseTrajectory) {
            this.globalSettings.enableMouseTrajectory = props.enableMouseTrajectory;
            settingsActuallyChanged = true;
        }
        if (props?.defaultHitSlop !== undefined) {
            const newSlop = this.normalizeHitSlop(props.defaultHitSlop);
            if (JSON.stringify(this.globalSettings.defaultHitSlop) !== JSON.stringify(newSlop)) {
                this.globalSettings.defaultHitSlop = newSlop;
                settingsActuallyChanged = true;
                // Note: This won't update existing elements' hitSlop unless they are re-registered.
            }
        }
        if (props?.resizeScrollThrottleDelay !== undefined &&
            this.globalSettings.resizeScrollThrottleDelay !== props.resizeScrollThrottleDelay) {
            this.globalSettings.resizeScrollThrottleDelay = props.resizeScrollThrottleDelay;
            settingsActuallyChanged = true;
        }
        if (props?.debug !== undefined && this.globalSettings.debug !== props.debug) {
            this.globalSettings.debug = props.debug;
            if (this.globalSettings.debug) {
                this.turnOnDebugMode();
            }
            else {
                if (this.debugger) {
                    this.debugger.cleanup();
                    this.debugger = null;
                }
            }
            this.debugMode = this.globalSettings.debug;
        }
        if (settingsActuallyChanged && this.globalSettings.debug && this.debugger) {
            this.debugger.updateControlsState(this.globalSettings);
            this.debugger.updateTrajectoryVisuals(this.currentPoint, this.predictedPoint, this.globalSettings.enableMouseTrajectory);
        }
    }
    turnOnDebugMode() {
        this.debugMode = true; // Ensure this is true when method is called
        if (!this.debugger) {
            this.debugger = new ForesightDebugger(this);
            this.debugger.initialize(this.links, this.globalSettings, this.currentPoint, this.predictedPoint);
        }
        else {
            // If debugger exists, ensure its controls are up-to-date with current globalSettings
            // This could happen if debug was false, then true again, or settings changed.
            this.debugger.updateControlsState(this.globalSettings);
            this.debugger.updateTrajectoryVisuals(this.currentPoint, this.predictedPoint, this.globalSettings.enableMouseTrajectory);
        }
    }
    getExpandedRect(baseRect, hitSlop) {
        return {
            left: baseRect.left - hitSlop.left,
            right: baseRect.right + hitSlop.right,
            top: baseRect.top - hitSlop.top,
            bottom: baseRect.bottom + hitSlop.bottom,
        };
    }
    updateExpandedRect(element, hitSlop) {
        const elementData = this.links.get(element);
        if (!elementData)
            return;
        const expandedRect = this.getExpandedRect(element.getBoundingClientRect(), hitSlop);
        if (JSON.stringify(expandedRect) !== JSON.stringify(elementData.elementBounds.expandedRect)) {
            this.links.set(element, {
                ...elementData,
                elementBounds: {
                    ...elementData.elementBounds,
                    expandedRect,
                },
            });
        }
        if (this.debugMode && this.debugger) {
            const updatedData = this.links.get(element);
            if (updatedData)
                this.debugger.createOrUpdateLinkOverlay(element, updatedData);
        }
    }
    updateAllRects() {
        this.links.forEach((data, element) => {
            this.updateExpandedRect(element, data.elementBounds.hitSlop);
        });
    }
    predictMousePosition = (point) => {
        const now = performance.now();
        const currentPosition = { point, time: now };
        const { x, y } = point;
        this.positions.push(currentPosition);
        if (this.positions.length > this.globalSettings.positionHistorySize) {
            this.positions.shift();
        }
        if (this.positions.length < 2) {
            return { x, y };
        }
        const first = this.positions[0];
        const last = this.positions[this.positions.length - 1];
        const dt = (last.time - first.time) / 1000;
        if (dt === 0) {
            return { x, y };
        }
        const dx = last.point.x - first.point.x;
        const dy = last.point.y - first.point.y;
        const vx = dx / dt;
        const vy = dy / dt;
        const trajectoryPredictionTimeInSeconds = this.globalSettings.trajectoryPredictionTime / 1000;
        const predictedX = x + vx * trajectoryPredictionTimeInSeconds;
        const predictedY = y + vy * trajectoryPredictionTimeInSeconds;
        return { x: predictedX, y: predictedY };
    };
    pointIntersectsRect = (x, y, rect) => {
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };
    isMouseInExpandedArea = (area, clientPoint, isAlreadyHovering) => {
        const isInExpandedArea = clientPoint.x >= area.left &&
            clientPoint.x <= area.right &&
            clientPoint.y >= area.top &&
            clientPoint.y <= area.bottom;
        if (isInExpandedArea && !isAlreadyHovering) {
            return { isHoveringInArea: true, shouldRunCallback: true };
        }
        return { isHoveringInArea: isInExpandedArea, shouldRunCallback: false };
    };
    handleMouseMove = (e) => {
        this.currentPoint = { x: e.clientX, y: e.clientY };
        this.predictedPoint = this.globalSettings.enableMouseTrajectory
            ? this.predictMousePosition(this.currentPoint)
            : this.currentPoint;
        const linksToUpdateInDebugger = [];
        this.links.forEach((elementData, element) => {
            if (!elementData.elementBounds.expandedRect)
                return;
            const { isHoveringInArea, shouldRunCallback } = this.isMouseInExpandedArea(elementData.elementBounds.expandedRect, this.currentPoint, elementData.isHovering);
            let linkStateChanged = false;
            if (this.globalSettings.enableMouseTrajectory && !isHoveringInArea) {
                if (this.pointIntersectsRect(this.predictedPoint.x, this.predictedPoint.y, elementData.elementBounds.expandedRect)) {
                    if (!elementData.isTrajectoryHit) {
                        elementData.callback();
                        this.links.set(element, {
                            ...elementData,
                            isTrajectoryHit: true,
                            trajectoryHitTime: performance.now(),
                            isHovering: isHoveringInArea,
                        });
                        linkStateChanged = true;
                    }
                }
            }
            if (elementData.isHovering !== isHoveringInArea) {
                this.links.set(element, {
                    ...elementData,
                    isHovering: isHoveringInArea,
                    // Preserve trajectory hit state if it was already hit
                    isTrajectoryHit: this.links.get(element).isTrajectoryHit,
                    trajectoryHitTime: this.links.get(element).trajectoryHitTime,
                });
                linkStateChanged = true;
            }
            if (linkStateChanged) {
                linksToUpdateInDebugger.push(element);
            }
            if (shouldRunCallback) {
                if (!elementData.isTrajectoryHit ||
                    (elementData.isTrajectoryHit && !this.globalSettings.enableMouseTrajectory)) {
                    elementData.callback();
                }
            }
        });
        if (this.debugMode && this.debugger) {
            linksToUpdateInDebugger.forEach((element) => {
                const data = this.links.get(element);
                if (data)
                    this.debugger.createOrUpdateLinkOverlay(element, data);
            });
            this.debugger.updateTrajectoryVisuals(this.currentPoint, this.predictedPoint, this.globalSettings.enableMouseTrajectory);
        }
    };
    handleResizeOrScroll = () => {
        if (this.resizeScrollThrottleTimeoutId) {
            clearTimeout(this.resizeScrollThrottleTimeoutId);
        }
        const now = performance.now();
        const timeSinceLastCall = now - this.lastResizeScrollCallTimestamp;
        const currentDelay = this.globalSettings.resizeScrollThrottleDelay;
        if (timeSinceLastCall >= currentDelay) {
            this.updateAllRects();
            this.lastResizeScrollCallTimestamp = now;
            this.resizeScrollThrottleTimeoutId = null;
        }
        else {
            this.resizeScrollThrottleTimeoutId = setTimeout(() => {
                this.updateAllRects();
                this.lastResizeScrollCallTimestamp = performance.now();
                this.resizeScrollThrottleTimeoutId = null;
            }, currentDelay - timeSinceLastCall);
        }
    };
    setupGlobalListeners() {
        if (this.isSetup)
            return;
        document.addEventListener("mousemove", this.handleMouseMove);
        window.addEventListener("resize", this.handleResizeOrScroll);
        window.addEventListener("scroll", this.handleResizeOrScroll);
        this.isSetup = true;
    }
    removeGlobalListeners() {
        document.removeEventListener("mousemove", this.handleMouseMove);
        window.removeEventListener("resize", this.handleResizeOrScroll);
        window.removeEventListener("scroll", this.handleResizeOrScroll);
        if (this.resizeScrollThrottleTimeoutId) {
            clearTimeout(this.resizeScrollThrottleTimeoutId);
            this.resizeScrollThrottleTimeoutId = null;
        }
        this.isSetup = false;
    }
}
