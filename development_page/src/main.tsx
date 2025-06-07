import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ForesightManager } from "../../src/Manager/ForesightManager.ts"

ForesightManager.initialize({
  debug: true,
  debuggerSettings: {
    isControlPanelDefaultMinimized: false,
  },
  enableMousePrediction: true,
  enableTabPrediction: true,
  positionHistorySize: 10,
  resizeScrollThrottleDelay: 0,
  trajectoryPredictionTime: 100,
  tabOffset: 4,
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
