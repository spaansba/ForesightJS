import "./App.css"
import { ForesightManager } from "foresightjs"
function App() {
  ForesightManager.initialize({
    enableMouseTrajectory: true,
    trajectoryPredictionTime: 80,
    debug: true,
  })

  return <></>
}

export default App
