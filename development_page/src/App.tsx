import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Main } from "./components/MainWrapper"
import Other from "./pages/other"
import { ForesightManager } from "../../src/ForesightManager/Manager/ForesightManager"

function App() {
  ForesightManager.initialize({
    debug: true,
    debuggerSettings: {
      isControlPanelDefaultMinimized: false,
    },
    enableMousePrediction: true,
    enableTabPrediction: true,
    positionHistorySize: 20,
    resizeScrollThrottleDelay: 50,
    trajectoryPredictionTime: 50,
    tabOffset: 3,
  })
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
