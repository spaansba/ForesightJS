import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ForesightDebuggerLit } from "js.foresight-devtools"
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

ForesightDebuggerLit.initialize(ForesightManager.instance)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
