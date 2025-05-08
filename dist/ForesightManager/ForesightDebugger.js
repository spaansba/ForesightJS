"use client";
export class IntentDebugger {
    foresightManagerInstance;
    shadowHost = null;
    shadowRoot = null;
    debugContainer = null;
    debugLinkOverlays = new Map();
    debugPredictedMouseIndicator = null;
    debugTrajectoryLine = null;
    debugControlsContainer = null;
    debugStyleElement = null;
    constructor(intentManager) {
        this.foresightManagerInstance = intentManager;
    }
    initialize(links, currentSettings, currentPoint, predictedPoint) {
        if (typeof window === "undefined")
            return;
        this.cleanup();
        this.shadowHost = document.createElement("div");
        this.shadowHost.id = "jsforesight-debugger-shadow-host";
        // Host itself should not capture pointer events unless specifically designed to.
        this.shadowHost.style.pointerEvents = "none";
        document.body.appendChild(this.shadowHost);
        this.shadowRoot = this.shadowHost.attachShadow({ mode: "open" });
        this.debugStyleElement = document.createElement("style");
        this.debugStyleElement.textContent = `
      #jsforesight-debug-container {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 9999;
      }
      .jsforesight-link-overlay {
        position: absolute; border: 2px solid purple;
        background-color: rgba(0, 0, 255, 0.1); box-sizing: border-box;
        transition: opacity 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
      }
      .jsforesight-link-overlay.active {
        border-color: red; background-color: rgba(255, 0, 0, 0.1);
      }
      .jsforesight-link-overlay.trajectory-hit {
        border-color: lime; background-color: rgba(0, 255, 0, 0.3);
        box-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
      }
      .jsforesight-expanded-overlay {
        position: absolute; border: 1px dashed rgba(0, 0, 255, 0.5);
        background-color: rgba(0, 0, 255, 0.05); box-sizing: border-box;
      }
      .jsforesight-mouse-predicted {
        position: absolute; width: 20px; height: 20px; border-radius: 50%;
        border: 2px solid orange; background-color: rgba(255, 165, 0, 0.3);
        transform: translate(-50%, -50%); z-index: 10000;
      }
      .jsforesight-trajectory-line {
        position: absolute; height: 2px; background-color: rgba(255, 100, 0, 0.5);
        transform-origin: left center; z-index: 9999;
      }
      #jsforesight-debug-controls {
        position: fixed; bottom: 10px; right: 10px;
        background-color: rgba(0, 0, 0, 0.7); color: white; padding: 10px;
        border-radius: 5px; font-family: monospace; font-size: 12px;
        z-index: 10001; pointer-events: auto; /* Make controls interactive */
      }
      #jsforesight-debug-controls h3 { margin: 0 0 5px 0; font-size: 14px; }
      #jsforesight-debug-controls label { display: block; margin: 5px 0; }
      #jsforesight-debug-controls input { margin-right: 5px; vertical-align: middle; }
      #jsforesight-debug-controls button {
        margin: 5px 5px 0 0; padding: 3px 8px; background: #444;
        border: 1px solid #666; color: white; border-radius: 3px; cursor: pointer;
      }
      #jsforesight-debug-controls button:hover { background: #555; }
    `;
        this.shadowRoot.appendChild(this.debugStyleElement);
        this.debugContainer = document.createElement("div");
        this.debugContainer.id = "jsforesight-debug-container";
        this.shadowRoot.appendChild(this.debugContainer);
        this.debugPredictedMouseIndicator = document.createElement("div");
        this.debugPredictedMouseIndicator.className = "jsforesight-mouse-predicted";
        this.debugContainer.appendChild(this.debugPredictedMouseIndicator);
        this.debugTrajectoryLine = document.createElement("div");
        this.debugTrajectoryLine.className = "jsforesight-trajectory-line";
        this.debugContainer.appendChild(this.debugTrajectoryLine);
        this.createDebugControls(currentSettings); // Appends to shadowRoot
        links.forEach((data, element) => {
            this.createOrUpdateLinkOverlay(element, data);
        });
        this.updateTrajectoryVisuals(currentPoint, predictedPoint, currentSettings.enableMouseTrajectory);
    }
    cleanup() {
        this.shadowHost?.remove();
        this.shadowHost = null;
        this.shadowRoot = null;
    }
    createOrUpdateLinkOverlay(element, linkData) {
        if (!this.debugContainer)
            return;
        let overlays = this.debugLinkOverlays.get(element);
        if (!overlays) {
            const linkOverlay = document.createElement("div");
            linkOverlay.className = "jsforesight-link-overlay";
            this.debugContainer.appendChild(linkOverlay);
            const expandedOverlay = document.createElement("div");
            expandedOverlay.className = "jsforesight-expanded-overlay";
            this.debugContainer.appendChild(expandedOverlay);
            overlays = { linkOverlay, expandedOverlay };
            this.debugLinkOverlays.set(element, overlays);
        }
        const { linkOverlay, expandedOverlay } = overlays;
        const rect = element.getBoundingClientRect();
        // Corrected: Since debugContainer is position:fixed top:0 left:0,
        // getBoundingClientRect() coords are already relative to it.
        linkOverlay.style.left = `${rect.left}px`;
        linkOverlay.style.top = `${rect.top}px`;
        linkOverlay.style.width = `${rect.width}px`;
        linkOverlay.style.height = `${rect.height}px`;
        linkOverlay.classList.toggle("trajectory-hit", linkData.isTrajectoryHit);
        linkOverlay.classList.toggle("active", linkData.isHovering);
        if (linkData.expandedRect) {
            // Corrected: Assuming expandedRect coords are viewport-relative.
            expandedOverlay.style.left = `${linkData.expandedRect.left}px`;
            expandedOverlay.style.top = `${linkData.expandedRect.top}px`;
            expandedOverlay.style.width = `${linkData.expandedRect.right - linkData.expandedRect.left}px`;
            expandedOverlay.style.height = `${linkData.expandedRect.bottom - linkData.expandedRect.top}px`;
            expandedOverlay.style.display = "block";
        }
        else {
            expandedOverlay.style.display = "none";
        }
    }
    removeLinkOverlay(element) {
        const overlays = this.debugLinkOverlays.get(element);
        if (overlays) {
            overlays.linkOverlay.remove();
            overlays.expandedOverlay.remove();
            this.debugLinkOverlays.delete(element);
        }
    }
    updateAllLinkVisuals(links) {
        if (!this.shadowRoot || !this.debugContainer)
            return;
        const currentElements = new Set(links.keys());
        this.debugLinkOverlays.forEach((_, element) => {
            if (!currentElements.has(element)) {
                this.removeLinkOverlay(element);
            }
        });
        links.forEach((data, element) => {
            this.createOrUpdateLinkOverlay(element, data);
        });
    }
    updateTrajectoryVisuals(currentPoint, predictedPoint, enableMouseTrajectory) {
        if (!this.shadowRoot || !this.debugContainer)
            return;
        if (this.debugPredictedMouseIndicator) {
            this.debugPredictedMouseIndicator.style.left = `${predictedPoint?.x || 0}px`;
            this.debugPredictedMouseIndicator.style.top = `${predictedPoint?.y || 0}px`;
            this.debugPredictedMouseIndicator.style.display =
                enableMouseTrajectory && predictedPoint ? "block" : "none";
        }
        if (this.debugTrajectoryLine) {
            if (enableMouseTrajectory && currentPoint && predictedPoint) {
                const dx = predictedPoint.x - currentPoint.x;
                const dy = predictedPoint.y - currentPoint.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                this.debugTrajectoryLine.style.left = `${currentPoint.x}px`;
                this.debugTrajectoryLine.style.top = `${currentPoint.y}px`;
                this.debugTrajectoryLine.style.width = `${length}px`;
                this.debugTrajectoryLine.style.transform = `translateY(-50%) rotate(${angle}deg)`;
                this.debugTrajectoryLine.style.display = "block";
            }
            else {
                this.debugTrajectoryLine.style.display = "none";
            }
        }
    }
    createDebugControls(initialSettings) {
        if (!this.shadowRoot)
            return;
        this.debugControlsContainer = document.createElement("div");
        this.debugControlsContainer.id = "jsforesight-debug-controls";
        this.shadowRoot.appendChild(this.debugControlsContainer);
        this.debugControlsContainer.innerHTML = `
      <h3>Trajectory Debug</h3>
      <label>
        <input type="checkbox" id="jsforesight-trajectory-enabled" ${initialSettings.enableMouseTrajectory ? "checked" : ""}>
        Enable Trajectory
      </label>
      <label>
        History Size: <span id="jsforesight-history-value">${initialSettings.positionHistorySize}</span>
        <input type="range" id="jsforesight-history-size" min="2" max="20" value="${initialSettings.positionHistorySize}">
      </label>
      <label>
        Prediction Time: <span id="jsforesight-prediction-value">${initialSettings.trajectoryPredictionTime}</span>ms
        <input type="range" id="jsforesight-prediction-time" min="10" max="500" value="${initialSettings.trajectoryPredictionTime}">
      </label>
     
    `;
        const enabledCheckbox = this.debugControlsContainer.querySelector("#jsforesight-trajectory-enabled");
        enabledCheckbox.addEventListener("change", () => {
            this.foresightManagerInstance.setTrajectorySettings({
                enabled: enabledCheckbox.checked,
            });
        });
        const historySlider = this.debugControlsContainer.querySelector("#jsforesight-history-size");
        const historyValueSpan = this.debugControlsContainer.querySelector("#jsforesight-history-value");
        historySlider.addEventListener("input", () => {
            const value = parseInt(historySlider.value);
            historyValueSpan.textContent = value.toString();
            this.foresightManagerInstance.setTrajectorySettings({ historySize: value });
        });
        const predictionSlider = this.debugControlsContainer.querySelector("#jsforesight-prediction-time");
        const predictionValueSpan = this.debugControlsContainer.querySelector("#jsforesight-prediction-value");
        predictionSlider.addEventListener("input", () => {
            const value = parseInt(predictionSlider.value);
            predictionValueSpan.textContent = value.toString();
            this.foresightManagerInstance.setTrajectorySettings({
                predictionTime: value,
            });
        });
    }
    updateControlsState(settings) {
        if (!this.debugControlsContainer)
            return;
        const enabledCheckbox = this.debugControlsContainer.querySelector("#jsforesight-trajectory-enabled");
        if (enabledCheckbox)
            enabledCheckbox.checked = settings.enableMouseTrajectory;
        const historySlider = this.debugControlsContainer.querySelector("#jsforesight-history-size");
        const historyValueSpan = this.debugControlsContainer.querySelector("#jsforesight-history-value");
        if (historySlider && historyValueSpan) {
            historySlider.value = settings.positionHistorySize.toString();
            historyValueSpan.textContent = settings.positionHistorySize.toString();
        }
        const predictionSlider = this.debugControlsContainer.querySelector("#jsforesight-prediction-time");
        const predictionValueSpan = this.debugControlsContainer.querySelector("#jsforesight-prediction-value");
        if (predictionSlider && predictionValueSpan) {
            predictionSlider.value = settings.trajectoryPredictionTime.toString();
            predictionValueSpan.textContent = settings.trajectoryPredictionTime.toString();
        }
    }
}
