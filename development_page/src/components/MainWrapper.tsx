import ForesightButtonVisibility from "./test-buttons/ForesightButtonVisibility"
import ForesightButtonResizeable from "./test-buttons/ForesightButtonResizeable"
import ForesightButtonRemoveable from "./test-buttons/ForesightButtonRemoveable"
import ForesightButtonNoName from "./test-buttons/ForesightButtonNoName"
import ControlSection from "./ui/ControlSection"
import { useResetKey } from "../stores/ButtonStateStore"

export const Main = () => {
  const resetKey = useResetKey()

  return (
    <div
      key={resetKey}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans"
    >
      <ControlSection
        title="Foresight Manager Development Controls"
        subtitle="Control the behavior of the test buttons below using these controls"
      />

      <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">Foresight Test Buttons</h2>
      <div className="px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Foresight Buttons Container */}
          <div className="flex flex-wrap gap-8 justify-center mb-12">
            <ForesightButtonVisibility />
            <ForesightButtonResizeable />
            <ForesightButtonRemoveable />

            <ForesightButtonNoName />
          </div>
        </div>
      </div>
    </div>
  )
}
