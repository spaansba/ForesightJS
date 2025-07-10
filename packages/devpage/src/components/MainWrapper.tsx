import ForesightButtonVisibility from "./test-buttons/ForesightButtonVisibility"
import ForesightButtonResizeable from "./test-buttons/ForesightButtonResizeable"
import ForesightButtonRemoveable from "./test-buttons/ForesightButtonRemoveable"
import ForesightButtonNoName from "./test-buttons/ForesightButtonNoName"
import ControlSection from "./ui/ControlSection"
import { useResetKey } from "../stores/ButtonStateStore"
import { ForesightManager } from "js.foresight"
import { useEffect } from "react"
import ForesightButtonError from "./test-buttons/ForesightButtonError"

export const Main = () => {
  const resetKey = useResetKey()

  useEffect(() => {
    const handleCallbackFired = () => {}

    ForesightManager.instance.addEventListener("callbackCompleted", handleCallbackFired)

    return () => {
      ForesightManager.instance.removeEventListener("callbackCompleted", handleCallbackFired)
    }
  }, [])
  return (
    <div key={resetKey} className="min-h-screen font-sans">
      <ControlSection
        title="Foresight Manager Development Controls"
        subtitle="Control the behavior of the test buttons below using these controls"
      />

      <h2 className="text-3xl font-bold text-center  mb-8">Foresight Test Buttons</h2>
      <div className="px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-8 justify-center mb-12">
            <ForesightButtonVisibility name="visibility" />
            <ForesightButtonError name="callback errror" />
            <ForesightButtonNoName />
            <ForesightButtonRemoveable name="removeable" />
            <ForesightButtonResizeable name="resizeable" />
            <ForesightButtonVisibility name="visibility2" />
            <ForesightButtonRemoveable name="removeable2" />
            <ForesightButtonVisibility name="visibility3" />
            <ForesightButtonRemoveable name="removeable3" />
          </div>
        </div>
      </div>
    </div>
  )
}
