import { ForesightManager } from "../../src/ForesightManager/Manager/ForesightManager"

import ReactPage from "./pages/ReactPage"

ForesightManager.initialize({
  debug: true,
  debuggerSettings: {
    isControlPanelDefaultMinimized: true,
  },
})

function App() {
  return <ReactPage />
}

export default App
