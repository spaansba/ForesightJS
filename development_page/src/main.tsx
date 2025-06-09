import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ForesightManager } from "../../src/Manager/ForesightManager.ts"
import type { ForesightElementData, ForesightManagerData } from "../../src/types/types.ts"

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
  onAnyCallbackFired: (elementData: ForesightElementData, managerData: ForesightManagerData) => {
    // console.log(`Intent predicted for: ${elementData.name}`)
    // console.log(`Total tab hits: ${managerData.globalCallbackHits.tab}`)
    // console.log(`total mouse hits ${managerData.globalCallbackHits.mouse}`)
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
