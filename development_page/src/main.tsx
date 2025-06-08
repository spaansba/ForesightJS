import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ForesightManager } from "../../src/Manager/ForesightManager.ts"

ForesightManager.initialize({
  debug: true,
  enableMousePrediction: true,
  positionHistorySize: 10,
  trajectoryPredictionTime: 100,
  defaultHitSlop: {
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
  },
  debuggerSettings: {
    isControlPanelDefaultMinimized: false,
    showNameTags: true,
  },
  enableTabPrediction: true,
  tabOffset: 4,
  onAnyCallbackFired: () => {
    console.log("here")
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
