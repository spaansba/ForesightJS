import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ForesightDebugger } from "../../src/Debugger/ForesightDebugger.ts"
import { ForesightManager } from "../../src/Manager/ForesightManager.ts"

ForesightDebugger.initialize(ForesightManager.instance, {
  showDebugger: true,
  showNameTags: true,
  isControlPanelDefaultMinimized: false,
  sortElementList: "visibility",
})

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
  // onAnyCallbackFired: (elementData: ForesightElementData, managerData: ForesightManagerData) => {
  // console.log(`Intent predicted for: ${elementData.name}`)
  // console.log(`Total tab hits: ${managerData.globalCallbackHits.tab}`)
  // console.log(`total mouse hits ${managerData.globalCallbackHits.mouse}`)
  // },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
