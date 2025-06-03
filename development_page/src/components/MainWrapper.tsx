import ForesightButtonVisibility from "./test-buttons/ForesightButtonVisibility"
import ForesightButtonResizeable from "./test-buttons/ForesightButtonResizeable"
import ForesightButtonRemoveable from "./test-buttons/ForesightButtonRemoveable"
import ForesightButtonNoName from "./test-buttons/ForesightButtonNoName"
import TestExplanationOverview from "./ui/TestExplanationOverview"
import ControlSection from "./ui/ControlSection"
import { useResetKey } from "../stores/ButtonStateStore"

export const Main = () => {
  const resetKey = useResetKey()
  
  return (
    <div key={resetKey} className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
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
            <div className="flex flex-col items-center space-y-4">
              <h3 className="text-lg font-semibold text-slate-700">No Name Test</h3>
              <div className="flex items-center justify-center">
                <ForesightButtonNoName />
              </div>
              <p className="text-sm text-slate-600 text-center max-w-32">
                Tests unnamed element handling
              </p>
            </div>
          </div>
          
          <TestExplanationOverview />
        </div>
      </div>
    </div>
  )
}
