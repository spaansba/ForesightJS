import { ForesightManager } from "../../src/ForesightManager/Manager/ForesightManager"

import { Main } from "./_components/MainWrapper"

ForesightManager.initialize({
  debug: true,
  debuggerSettings: {
    isControlPanelDefaultMinimized: false,
  },
  enableTabPrediction: false,
})

function App() {
  return <Main />
}

export default App
