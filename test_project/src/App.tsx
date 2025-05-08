import { ForesightManager } from "../../src/ForesightManager/ForesightManager"
import CustomButton from "./_components/CustomButton"

function App() {
  ForesightManager.initialize({
    enableMouseTrajectory: true,
    trajectoryPredictionTime: 80,
    debug: true,
  })

  return (
    <div className="bg-amber-200 h-screen w-screen">
      <CustomButton></CustomButton>
    </div>
  )
}

export default App
