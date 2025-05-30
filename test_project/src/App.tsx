import { ForesightManager } from "../../src/ForesightManager/Manager/ForesightManager"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Main } from "./_components/MainWrapper"
import Other from "./pages/other"

ForesightManager.initialize({
  debug: true,
  debuggerSettings: {
    isControlPanelDefaultMinimized: false,
  },
  enableMousePrediction: true,
  enableTabPrediction: true,
  positionHistorySize: 8,
  resizeScrollThrottleDelay: 8,
  tabOffset: 4,
  trajectoryPredictionTime: 10,
  defaultHitSlop: { top: 10, right: 10, left: 10, bottom: 10 },
})

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/other" element={<Other />} />
      </Routes>
    </Router>
  )
}

export default App
