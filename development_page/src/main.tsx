import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ForesightManager } from "../../src/Manager/ForesightManager"

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

// Initialize the debugger with the manager instance
// ForesightDebugger.initialize(ForesightManager.instance, {
//   showDebugger: true,
//   showNameTags: true,
//   isControlPanelDefaultMinimized: false,
//   sortElementList: "visibility",
// })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
