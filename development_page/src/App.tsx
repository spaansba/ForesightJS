import { ForesightManager } from "../../src/ForesightManager/Manager/ForesightManager"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Main } from "./components/MainWrapper"
import Other from "./pages/other"

ForesightManager.initialize({
  debug: true,
  debuggerSettings: {
    isControlPanelDefaultMinimized: false,
  },
  enableMousePrediction: true,
  enableTabPrediction: true,
  positionHistorySize: 8,
  resizeScrollThrottleDelay: 50,
  trajectoryPredictionTime: 90,
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
