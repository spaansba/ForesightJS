import { ForesightManager } from "../../src/ForesightManager/Manager/ForesightManager"

import ReactPage from "./pages/ReactPage"

ForesightManager.initialize({
  debug: true,
  defaultHitSlop: 0,
  debuggerSettings: {
    isControlPanelDefaultMinimized: true,
  },
})

function App() {
  return <ReactPage />
}

export default App
