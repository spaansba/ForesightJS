import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ForesightDebugger } from "js.foresight-devtools"
import { ForesightManager } from "js.foresight"

ForesightManager.initialize({
  enableMousePrediction: true,
  positionHistorySize: 10,
  trajectoryPredictionTime: 100,
  defaultHitSlop: {
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
  },
  enableTabPrediction: true,
  tabOffset: 2,
})

// Initialize the debugger with the manager instance
ForesightDebugger.initialize(ForesightManager.instance, {
  showDebugger: true,
  showNameTags: true,
  isControlPanelDefaultMinimized: true,
  sortElementList: "visibility",
  logging: {
    callbackFired: true,
    elementRegistered: true,
    elementUnregistered: true,
    elementDataUpdated: true,
    mouseTrajectoryUpdate: false,
    scrollTrajectoryUpdate: true,
    managerSettingsChanged: true,
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
