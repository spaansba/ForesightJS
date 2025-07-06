import type { ForesightElementData, ForesightManagerSettings } from "js.foresight"
import { ForesightManager } from "js.foresight"
import type { ControllerTabs, DebuggerSettings } from "../types/types"

import {
  MAX_POSITION_HISTORY_SIZE,
  MAX_SCROLL_MARGIN,
  MAX_TAB_OFFSET,
  MAX_TRAJECTORY_PREDICTION_TIME,
  MIN_POSITION_HISTORY_SIZE,
  MIN_SCROLL_MARGIN,
  MIN_TAB_OFFSET,
  MIN_TRAJECTORY_PREDICTION_TIME,
} from "../constants"
import type { ForesightDebugger } from "../debugger/ForesightDebugger"
import { createAndAppendStyle } from "../debugger/helpers/createAndAppend"
import { ControlPanelElementTab } from "./controlPanelElementTab/ControlPanelElementTab"
import { ControlPanelLogTab } from "./controlPanelLogTab/ControlPanelLogTab"
import { ControlPanelSettingsTab } from "./controlPanelSettingsTab/ControlPanelSettingsTab"

const COPY_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`

export class DebuggerControlPanel {
  private foresightManagerInstance: ForesightManager
  private debuggerInstance: ForesightDebugger
  private static debuggerControlPanelInstance: DebuggerControlPanel
  private elementTabManager!: ControlPanelElementTab
  private logTabManager!: ControlPanelLogTab
  private settingsTabManager!: ControlPanelSettingsTab

  // These properties will be assigned in _setupDOMAndListeners
  private shadowRoot!: ShadowRoot
  private controlsContainer!: HTMLDivElement
  private controlPanelStyleElement!: HTMLStyleElement

  private containerMinimizeButton: HTMLButtonElement | null = null
  private isContainerMinimized: boolean = false

  // Tab system
  private tabContainer: HTMLElement | null = null
  private settingsTab: HTMLElement | null = null
  private elementsTab: HTMLElement | null = null
  private logsTab: HTMLElement | null = null
  private settingsContent: HTMLElement | null = null
  private elementsContent: HTMLElement | null = null
  private logsContent: HTMLElement | null = null
  private activeTab: ControllerTabs = "elements"
  public elementCount: {
    total: number
    intersecting: number
  } = {
    total: 0,
    intersecting: 0,
  }
  private titleElementCount: HTMLSpanElement | null = null

  private constructor(foresightManager: ForesightManager, debuggerInstance: ForesightDebugger) {
    this.foresightManagerInstance = foresightManager
    this.debuggerInstance = debuggerInstance
  }

  /**
   * The initialize method now creates the instance if needed,
   * then calls the setup method to ensure the UI is ready.
   */
  public static initialize(
    foresightManager: ForesightManager,
    debuggerInstance: ForesightDebugger,
    shadowRoot: ShadowRoot,
    debuggerSettings: DebuggerSettings
  ): DebuggerControlPanel {
    if (!DebuggerControlPanel.isInitiated) {
      DebuggerControlPanel.debuggerControlPanelInstance = new DebuggerControlPanel(
        foresightManager,
        debuggerInstance
      )
    }

    const instance = DebuggerControlPanel.debuggerControlPanelInstance

    // This will build the DOM on first run or rebuild it on subsequent runs after cleanup.
    instance._setupDOMAndListeners(shadowRoot, debuggerSettings)

    return instance
  }

  /**
   * All DOM creation and event listener setup logic is moved here.
   * This method can be called to "revive" a cleaned-up instance.
   */
  private _setupDOMAndListeners(shadowRoot: ShadowRoot, debuggerSettings: DebuggerSettings) {
    // Guard clause to prevent re-running if the UI is already active.
    if (this.controlsContainer) {
      return
    }

    this.shadowRoot = shadowRoot
    this.isContainerMinimized = debuggerSettings.isControlPanelDefaultMinimized
    this.controlsContainer = this.createControlContainer()
    this.shadowRoot.appendChild(this.controlsContainer)

    this.controlPanelStyleElement = createAndAppendStyle(
      this.getStyles(),
      this.shadowRoot,
      "debug-control-panel"
    )
    this.queryDOMElements()

    this.initializeElementTabManager()
    this.initializeLogTabManager()
    this.initializeSettingsTabManager()
    this.setupEventListeners()
    this.switchTab(this.activeTab)
    this.updateContainerVisibilityState()
    this.updateControlsStateFromCode(
      this.foresightManagerInstance.getManagerData.globalSettings,
      debuggerSettings
    )
  }

  private static get isInitiated(): boolean {
    return !!DebuggerControlPanel.debuggerControlPanelInstance
  }

  private switchTab(tab: ControllerTabs) {
    this.activeTab = tab

    // Update tab buttons
    this.settingsTab?.classList.toggle("active", tab === "settings")
    this.elementsTab?.classList.toggle("active", tab === "elements")
    this.logsTab?.classList.toggle("active", tab === "logs")

    // Update content visibility
    if (this.settingsContent)
      this.settingsContent.style.display = tab === "settings" ? "block" : "none"
    if (this.elementsContent)
      this.elementsContent.style.display = tab === "elements" ? "block" : "none"
    if (this.logsContent) this.logsContent.style.display = tab === "logs" ? "block" : "none"

    const settingsTabBar = this.controlsContainer.querySelector(".tab-bar-settings") as HTMLElement
    const elementsTabBar = this.controlsContainer.querySelector(".tab-bar-elements") as HTMLElement
    const logsTabBar = this.controlsContainer.querySelector(".tab-bar-logs") as HTMLElement

    if (settingsTabBar) settingsTabBar.style.display = tab === "settings" ? "flex" : "none"
    if (elementsTabBar) elementsTabBar.style.display = tab === "elements" ? "flex" : "none"
    if (logsTabBar) logsTabBar.style.display = tab === "logs" ? "flex" : "none"

    this.updateCurrentTabBarContent()
  }

  // These methods update only dynamic content without reinitializing
  public updateCurrentTabBarContent() {
    switch (this.activeTab) {
      case "settings":
        // Settings tab has no dynamic content
        break
      case "elements":
        this.elementTabManager.refreshHitsChip()
        break
      case "logs":
        this.logTabManager.refreshFullTabBarContent()
        break
    }
  }

  public addEventLog(type: any, event: any) {
    this.logTabManager.addEventLog(type, event)
  }

  public updateTitleElementCount() {
    if (!this.titleElementCount) return
    const registeredElements = Array.from(
      this.foresightManagerInstance.registeredElements.entries()
    )
    const total = registeredElements.length
    const intersecting = registeredElements.filter(
      ([_, elementData]) => elementData.isIntersectingWithViewport
    ).length
    this.elementCount = {
      total,
      intersecting,
    }
    this.titleElementCount.textContent = `${intersecting}/${total}`
    this.titleElementCount.title = `Elements visible in viewport vs total registered elements`
    this.elementTabManager.setVisibilityChip(total, intersecting)
  }

  private queryDOMElements() {
    this.containerMinimizeButton = this.controlsContainer.querySelector(".minimize-button")
    this.titleElementCount = this.controlsContainer.querySelector(".title-element-count")

    // Tab system
    this.tabContainer = this.controlsContainer.querySelector(".tab-container")
    this.settingsTab = this.controlsContainer.querySelector("[data-tab='settings']")
    this.elementsTab = this.controlsContainer.querySelector("[data-tab='elements']")
    this.logsTab = this.controlsContainer.querySelector("[data-tab='logs']")
    this.settingsContent = this.controlsContainer.querySelector(".settings-content")
    this.elementsContent = this.controlsContainer.querySelector(".elements-content")
    this.logsContent = this.controlsContainer.querySelector(".logs-content")
  }

  private initializeElementTabManager() {
    this.elementTabManager = new ControlPanelElementTab(
      this.foresightManagerInstance,
      this.debuggerInstance,
      this.controlsContainer
    )
  }

  private initializeLogTabManager() {
    this.logTabManager = new ControlPanelLogTab(
      this.foresightManagerInstance,
      this.debuggerInstance,
      this.controlsContainer
    )
    this.logTabManager.initialize(this.shadowRoot)
  }

  private initializeSettingsTabManager() {
    this.settingsTabManager = new ControlPanelSettingsTab(
      this.foresightManagerInstance,
      this.debuggerInstance,
      this.controlsContainer
    )
    this.settingsTabManager.initialize(this.shadowRoot)
  }

  private setupEventListeners() {
    this.containerMinimizeButton?.addEventListener("click", () => {
      this.isContainerMinimized = !this.isContainerMinimized
      this.updateContainerVisibilityState()
    })

    // Tab system event listeners
    this.settingsTab?.addEventListener("click", () => this.switchTab("settings"))
    this.elementsTab?.addEventListener("click", () => this.switchTab("elements"))
    this.logsTab?.addEventListener("click", () => this.switchTab("logs"))

    // Close dropdowns when clicking outside
    // TODO fix to close previous
    document.addEventListener("click", e => {
      const activeDropdown = this.controlsContainer?.querySelector(".dropdown-menu.active")
      if (
        activeDropdown &&
        !activeDropdown.closest(".dropdown-container")?.contains(e.target as Node)
      ) {
        activeDropdown.classList.remove("active")
      }
    })
  }

  private updateContainerVisibilityState() {
    if (!this.containerMinimizeButton) return
    if (this.isContainerMinimized) {
      this.controlsContainer.classList.add("minimized")
      this.containerMinimizeButton.textContent = "+"
      if (this.tabContainer) this.tabContainer.style.display = "none"
    } else {
      this.controlsContainer.classList.remove("minimized")
      this.containerMinimizeButton.textContent = "-"
      if (this.tabContainer) this.tabContainer.style.display = ""
    }
  }

  public updateControlsStateFromCode(
    managerSettings: ForesightManagerSettings,
    debuggerSettings: DebuggerSettings
  ) {
    this.settingsTabManager.updateControlsState(managerSettings, debuggerSettings)
    this.elementTabManager.updateSortOptionUI(debuggerSettings.sortElementList ?? "visibility")
  }

  public removeElementFromListContainer(elementData: ForesightElementData) {
    this.elementTabManager.removeElementFromListContainer(elementData)
  }

  public updateElementVisibilityStatus(elementData: ForesightElementData) {
    this.elementTabManager.updateElementVisibilityStatus(elementData)
  }

  public addElementToListContainer(elementData: ForesightElementData) {
    this.elementTabManager.addElementToListContainer(elementData)
  }
  /**
   * The cleanup method is updated to be more thorough, nullifying all
   * DOM-related properties to put the instance in a dormant state.
   */
  public cleanup() {
    this.controlsContainer?.remove()
    this.controlPanelStyleElement?.remove()

    this.elementTabManager.cleanup()
    this.logTabManager.cleanup()
    this.settingsTabManager.cleanup()

    // Nullify all DOM-related properties to signal it's "cleaned up"
    this.controlsContainer = null!
    this.controlPanelStyleElement = null!
    this.containerMinimizeButton = null

    // Tab system cleanup
    this.tabContainer = null
    this.settingsTab = null
    this.elementsTab = null
    this.logsTab = null
    this.settingsContent = null
    this.elementsContent = null
    this.logsContent = null
  }

  private createControlContainer(): HTMLDivElement {
    const container = document.createElement("div")
    container.id = "debug-controls"
    container.innerHTML = /* html */ `
      <div class="debugger-title-container">
        <button class="minimize-button">-</button>
        <h1>Foresight DevTools</h1>
        <span class="title-element-count">

        </span>
      </div>

      <div class="tab-container">
        <button class="tab-button active" data-tab="settings">Settings</button>
        <button class="tab-button" data-tab="elements">Elements</button>
        <button class="tab-button" data-tab="logs">Logs</button>
      </div>

      <div class="tab-content">
        <div class="tab-bar-settings" style="display: none;">
          <div class="tab-bar-info">
            <span class="tab-info-text">Change Foresight Settings in real-time</span>
          </div>
          <div class="tab-bar-actions">
            <button id="copy-settings" class="tab-bar-extra-button" title="Copy Settings to Clipboard">
              ${COPY_SVG_ICON}
            </button>
          </div>
        </div>
        
        <div class="tab-bar-elements" style="display: none;">
          <div class="tab-bar-info">
            <div class="stats-chips">
              <span class="chip visible" data-dynamic="elements-visible">0/0 visible</span>
              <span class="chip hits" data-dynamic="elements-hits">0 hits</span>
              <span class="chip sort" data-dynamic="elements-sort">▼ visibility</span>
            </div>
          </div>
          <div class="tab-bar-actions">
            <div class="dropdown-container">
              <button class="tab-bar-extra-button" id="sort-elements-button" title="Change element list sort order">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path></svg>
              </button>
              <div class="dropdown-menu" id="sort-options-dropdown">
                <button data-sort="visibility" title="Sort by Visibility">Visibility</button>
                <button data-sort="documentOrder" title="Sort by Document Order">Document Order</button>
                <button data-sort="insertionOrder" title="Sort by Insertion Order">Insertion Order</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="tab-bar-logs" style="display: none;">
          <div class="tab-bar-info">
            <div class="stats-chips">
              <span class="chip logs" data-dynamic="logs-count">0 events</span>
              <span class="chip filter" data-dynamic="logs-filter">✓ all events</span>
              <span class="chip location" data-dynamic="logs-location">=▣ panel</span>
            </div>
          </div>
          <div class="tab-bar-actions">
            <button id="clear-logs-button" class="tab-bar-extra-button" title="Clear All Logs">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            </button>
            <div class="dropdown-container">
              <button class="tab-bar-extra-button" id="filter-logs-button" title="Filter Log Events">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              </button>
              <div class="dropdown-menu" id="logs-filter-dropdown">
                <button data-log-type="callbackFired" title="Logs whenever an element's callback is hit.">Callback Fired</button>
                <button data-log-type="elementRegistered" title="Logs whenever an element is registered to the manager.">Element Registered</button>
                <button data-log-type="elementUnregistered" title="Logs whenever an element is unregistered from the manager.">Element Unregistered</button>
                <button data-log-type="elementDataUpdated" title="Logs when element data like visibility changes.">Element Data Updated</button>
                <button data-log-type="mouseTrajectoryUpdate" title="Logs all mouse trajectory updates.">Mouse Trajectory</button>
                <button data-log-type="scrollTrajectoryUpdate" title="Logs scroll trajectory updates.">Scroll Trajectory</button>
                <button data-log-type="managerSettingsChanged" title="Logs whenever manager settings are changed.">Settings Changed</button>
              </div>
            </div>
            <div class="dropdown-container">
              <button class="tab-bar-extra-button" id="log-location-button" title="Change Log Output Location">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><circle cx="8" cy="12" r="2"></circle><path d="m14 12 2 2 4-4"></path></svg>
              </button>
              <div class="dropdown-menu" id="log-location-dropdown">
                <button data-log-location="controlPanel" title="Show logs in this panel only">Panel Only</button>
                <button data-log-location="console" title="Show logs in browser console only">Console Only</button>
                <button data-log-location="both" title="Show logs in both panel and console">Both Panel & Console</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="settings-content">
          <div class="settings-section">
            <div class="settings-group">
              <h4>Mouse Prediction</h4>
              <div class="setting-item">
                <label for="trajectory-enabled">Enable Mouse Prediction
                  <span class="setting-description">Predict mouse movement trajectory and trigger callbacks before cursor reaches target</span>
                </label>
                <div class="setting-controls">
                  <input type="checkbox" id="trajectory-enabled">
                </div>
              </div>
              <div class="setting-item">
                <label for="history-size">Position History
                  <span class="setting-description">Number of past mouse positions stored for velocity calculations</span>
                </label>
                <div class="setting-controls">
                  <input type="range" id="history-size" min="${MIN_POSITION_HISTORY_SIZE}" max="${MAX_POSITION_HISTORY_SIZE}">
                  <span id="history-value" class="setting-value"></span>
                </div>
              </div>
              <div class="setting-item">
                <label for="prediction-time">Prediction Time
                  <span class="setting-description">How far into the future to calculate mouse trajectory path</span>
                </label>
                <div class="setting-controls">
                  <input type="range" id="prediction-time" min="${MIN_TRAJECTORY_PREDICTION_TIME}" max="${MAX_TRAJECTORY_PREDICTION_TIME}" step="10">
                  <span id="prediction-value" class="setting-value"></span>
                </div>
              </div>
            </div>

            <div class="settings-group">
              <h4>Keyboard Navigation</h4>
              <div class="setting-item">
                <label for="tab-enabled">Enable Tab Prediction
                  <span class="setting-description">Execute callbacks when user is within tab offset of registered elements</span>
                </label>
                <div class="setting-controls">
                  <input type="checkbox" id="tab-enabled">
                </div>
              </div>
              <div class="setting-item">
                <label for="tab-offset">Tab Offset
                  <span class="setting-description">Number of tabbable elements to look ahead when predicting navigation</span>
                </label>
                <div class="setting-controls">
                  <input type="range" id="tab-offset" min="${MIN_TAB_OFFSET}" max="${MAX_TAB_OFFSET}" step="1">
                  <span id="tab-offset-value" class="setting-value"></span>
                </div>
              </div>
            </div>

            <div class="settings-group">
              <h4>Scroll Prediction</h4>
              <div class="setting-item">
                <label for="scroll-enabled">Enable Scroll Prediction
                  <span class="setting-description">Predict scroll direction and trigger callbacks for elements in path</span>
                </label>
                <div class="setting-controls">
                  <input type="checkbox" id="scroll-enabled">
                </div>
              </div>
              <div class="setting-item">
                <label for="scroll-margin">Scroll Margin
                  <span class="setting-description">Pixel distance to check from mouse position in scroll direction</span>
                </label>
                <div class="setting-controls">
                  <input type="range" id="scroll-margin" min="${MIN_SCROLL_MARGIN}" max="${MAX_SCROLL_MARGIN}" step="10">
                  <span id="scroll-margin-value" class="setting-value"></span>
                </div>
              </div>
            </div>

            <div class="settings-group">
              <h4>Developer Tools</h4>
              <div class="setting-item">
                <label for="toggle-name-tags">Show Name Tags
                  <span class="setting-description">Display name tags over each registered element in debug mode</span>
                </label>
                <div class="setting-controls">
                  <input type="checkbox" id="toggle-name-tags">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="elements-content">
            <div id="element-list-items-container">
            </div>
        </div>

        <div class="logs-content">
          <div class="logs-container">
            <div class="no-items"></div>
          </div>
        </div>
      </div>
    `
    return container
  }

  private getStyles(): string {
    const elementItemHeight = 35 // px
    const elementListGap = 3 // px
    const numRowsToShow = 6
    const numItemsPerRow = 1
    const tabContentHeight = 330 // Fixed height for all tab content

    const rowsContentHeight =
      elementItemHeight * numRowsToShow + elementListGap * (numRowsToShow - 1)

    return /* css */ `
      #debug-controls {
        position: fixed; bottom: 10px; right: 10px;
        background-color: rgba(0, 0, 0, 0.90); color: white; padding: 12px;
        font-family: Arial, sans-serif; font-size: 13px;
        z-index: 10001; pointer-events: auto; display: flex; flex-direction: column;
        width: 400px;
        transition: width 0.3s ease, height 0.3s ease;
      }
      #debug-controls.minimized {
        width: 250px;
        overflow: hidden;
        padding: 12px; 
        gap: 0px;
      }

      #element-count,#callback-count {
        font-size: 12px;
        color: #9e9e9e;
      }

      .debugger-title-container {
        display: flex;
        justify-content: space-between ;
        padding: 0;
      }
      
      .minimize-button {
        background: none; border: none; color: white;
        font-size: 22px; cursor: pointer;
        line-height: 1;
        padding: 0;
        
      }
      
      .title-group { 
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        justify-content: center;
      }
      
      .title-element-count {
        font-size: 14px;
        text-align: right;
      }
      .debugger-title-container h1 { margin: 0; font-size: 15px; }

      /* Tab System */
      .tab-container {
        display: flex;
        justify-content: space-evenly;
        border-bottom: 2px solid #444;
        margin-top: 12px;
      }
      
      .tab-bar-extra-button {
        background: none; border: none; color: white; cursor: pointer;
        padding: 6px; display: flex; align-items: center; justify-content: center;
        transition: all 0.2s ease;
      }

       .tab-bar-extra-button svg {
        width: 16px; height: 16px; stroke: white; transition: stroke 0.2s;
       }
      
      .tab-bar-extra-button:hover {
        background-color: rgba(176, 196, 222, 0.1);
      }
      
      .tab-bar-extra-button:hover svg { 
        stroke: #b0c4de; 
      }
      
      .tab-bar-extra-button.active {
        background-color: rgba(176, 196, 222, 0.2);
      }
      
      .tab-bar-extra-button.active svg {
        stroke: #b0c4de;
      }

      .tab-button {
        background: none;
        border: none;
        color: #9e9e9e;
        width: 100%;
        padding: 8px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
        font-size: 13px;
        font-weight: 500;
      }
      
      .tab-button:hover {
        color: #b0c4de;
        background-color: rgba(176, 196, 222, 0.1);
      }
      
      .tab-button.active {
        color: #b0c4de;
        border-bottom-color: #b0c4de;
      }
      
      .tab-content {
        height: ${tabContentHeight}px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      #debug-controls.minimized .tab-content {
        height: 0;
        overflow: hidden;
      }
      
      /* Unified Tab Bar */
      .tab-bar-settings,
      .tab-bar-elements,
      .tab-bar-logs {
        display: flex;
        justify-content: space-between;
        padding: 4px 0 4px 0;
        border-bottom: 1px solid #444;
        position: sticky;
        top: 0;
        z-index: 5;
        min-height: 36px;
        backdrop-filter: none;
      }
      
      .tab-bar-info {
        display: flex;
        gap: 12px;
        align-items: center;
        flex: 1;
      }
      
      .tab-bar-actions {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      
      .stats-chips {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .chip {
        font-size: 11px;
        font-weight: 500;
        padding: 4px 8px;
        border: 1px solid #555;
        white-space: nowrap;
        letter-spacing: 0.3px;
        background: rgba(40, 40, 40, 0.7);
        color: #b0c4de;
      }
      
      .settings-content,
      .elements-content,
      .logs-content {
        flex: 1;
        overflow-y: auto;
      }
      
      /* Universal scrollbar styling for all scrollable areas */
      .settings-content::-webkit-scrollbar,
      .elements-content::-webkit-scrollbar,
      .logs-content::-webkit-scrollbar,
      .element-list::-webkit-scrollbar,
      .logs-container::-webkit-scrollbar { 
        width: 8px; 
      }
      
      .settings-content::-webkit-scrollbar-track,
      .elements-content::-webkit-scrollbar-track,
      .logs-content::-webkit-scrollbar-track,
      .element-list::-webkit-scrollbar-track,
      .logs-container::-webkit-scrollbar-track { 
        background: rgba(30, 30, 30, 0.5); 

      }
      
      .settings-content::-webkit-scrollbar-thumb,
      .elements-content::-webkit-scrollbar-thumb,
      .logs-content::-webkit-scrollbar-thumb,
      .element-list::-webkit-scrollbar-thumb,
      .logs-container::-webkit-scrollbar-thumb { 
        background-color: rgba(176, 196, 222, 0.5); 
       
        border: 2px solid rgba(0, 0, 0, 0.2); 
      }
      
      .settings-content::-webkit-scrollbar-thumb:hover,
      .elements-content::-webkit-scrollbar-thumb:hover,
      .logs-content::-webkit-scrollbar-thumb:hover,
      .element-list::-webkit-scrollbar-thumb:hover,
      .logs-container::-webkit-scrollbar-thumb:hover { 
        background-color: rgba(176, 196, 222, 0.7); 
      }
      
      /* Firefox scrollbar support */
      .settings-content,
      .elements-content,
      .logs-content,
      .element-list,
      .logs-container { 
        scrollbar-width: thin; 
        scrollbar-color: rgba(176, 196, 222, 0.5) rgba(30, 30, 30, 0.5); 
      }

      /* Elements Tab Styles */
      #element-count,#callback-count {
        font-size: 12px;
        color: #9e9e9e;
      }
      .header-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      /* Unified Dropdown Styles */
      .dropdown-container {
        position: relative;
      }
      
      .dropdown-menu {
        position: absolute;
        top: calc(100% + 5px);
        right: 0;
        z-index: 10;
        display: none;
        flex-direction: column;
        background-color: #3a3a3a;
        border: 1px solid #555;
        min-width: 200px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }
      
      .dropdown-menu.active {
        display: flex;
      }
      
      .dropdown-menu button {
        background: none; border: none; color: #ccc;
        font-size: 12px; text-align: left; padding: 8px 12px;
        cursor: pointer; transition: all 0.2s ease;
        display: flex; align-items: center; position: relative;
      }
      
      .dropdown-menu button:hover {
        background-color: #555; color: white;
      }
      
      .dropdown-menu button.active {
        color: #b0c4de; font-weight: bold;
        background-color: rgba(176, 196, 222, 0.1);
      }
      
      .dropdown-menu button.active::after {
        content: '✓'; position: absolute; right: 8px;
        top: 50%; transform: translateY(-50%); color: #b0c4de;
        font-weight: bold;
      }

      .element-list {
        flex: 1;
        overflow-y: auto;
        background-color: rgba(20, 20, 20, 0.5);
        border-radius: 3px;
        padding: 0;
        display: flex;
        min-height: 300px;
      }


      #element-list-items-container { 
        display: flex;
        flex-wrap: wrap;
        
        min-height: ${rowsContentHeight}px;
        box-sizing: border-box;
        align-content: flex-start;
      }
      #element-list-items-container > em {
        flex-basis: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        font-style: italic;
        color: #9e9e9e;
        font-size: 12px;
        background: none;
      }
      .element-list-item {
        flex-basis: calc((100% - (${
          numItemsPerRow - 1
        } * ${elementListGap}px)) / ${numItemsPerRow});
        flex-grow: 0;
        flex-shrink: 0;
        height: ${elementItemHeight}px;
        box-sizing: border-box;
        padding: 5px;
        display: flex;
        align-items: center;
        gap: 5px;
        background-color: rgba(50,50,50,0.7);
        transition: background-color 0.2s ease, opacity 0.2s ease;
        font-size: 11px; 
        overflow: hidden;
      }
      
      /* Viewport intersection styling */
      .element-list-item.not-in-viewport { opacity: 0.4; }
      
      .element-list-item .element-name {
        flex-grow: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px; 
        font-weight: bold;
      }
      .element-list-item .intersecting-indicator {
        font-size: 12px;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
      }
      .element-list-item .hit-behavior,
      .element-list-item .hit-slop {
        font-size: 10px; 
        color: #b0b0b0;
        padding: 2px 5px; 
        border-radius: 3px; 
        background-color: rgba(0,0,0,0.2);
        flex-shrink: 0;
      }
      
      .tab-bar-actions {
        position: relative;
      }
      
      /* Log styles will be included by LogTab component */
    `
  }
}
