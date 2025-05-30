import { ForesightManager } from "../../src/ForesightManager/Manager/ForesightManager"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Main } from "./_components/MainWrapper"
import Other from "./pages/other"

ForesightManager.initialize({
  debug: true,
  debuggerSettings: {
    isControlPanelDefaultMinimized: false,
  },
  enableTabPrediction: false,
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
