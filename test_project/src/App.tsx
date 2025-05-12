import { ForesightManager } from "../../src/ForesightManager/Manager/ForesightManager"
import PageRouter from "./PageRouter"

ForesightManager.initialize({
  debug: true,
  defaultHitSlop: 0,
})

function App() {
  return (
    <div className="app-container">
      <PageRouter />
    </div>
  )
}

export default App
