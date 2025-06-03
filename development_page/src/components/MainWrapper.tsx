import { useState } from "react"
import type { ControlButton } from "./layout/PageLayout"
import PageLayout from "./layout/PageLayout"
import ForesightButtonVisibility from "./test-buttons/ForesightButtonVisibility"
import ForesightButtonResizeable from "./test-buttons/ForesightButtonResizeable"
import ForesightButtonRemoveable from "./test-buttons/ForesightButtonRemoveable"
import ForesightButtonNoName from "./test-buttons/ForesightButtonNoName"
import TestExplanationOverview from "./ui/TestExplanationOverview"

export const Main = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [isResized, setIsResized] = useState(false)
  const [shouldBeRemoved, setShouldBeRemoved] = useState(false)

  const controlButtons: ControlButton[] = [
    {
      id: "page-switch",
      label: "Switch to other page",
      description: "Navigate to the alternate test page",
      onClick: null,
      isActive: false,
      type: "link",
      to: "/other",
    },
    {
      id: "visibility-toggle",
      label: `Visibility: ${isVisible.toString()}`,
      description: "Toggle the visibility of the visibility test button",
      onClick: () => setIsVisible(!isVisible),
      isActive: isVisible,
      type: "button",
    },
    {
      id: "resize-toggle",
      label: `Resize: ${isResized.toString()}`,
      description: "Toggle the size of the resizable test button",
      onClick: () => setIsResized(!isResized),
      isActive: isResized,
      type: "button",
    },
    {
      id: "remove-toggle",
      label: `Remove: ${shouldBeRemoved.toString()}`,
      description: "Toggle the removal of the removable test button",
      onClick: () => setShouldBeRemoved(!shouldBeRemoved),
      isActive: shouldBeRemoved,
      type: "button",
    },
  ]

  return (
    <PageLayout
      title="Foresight Manager Development Controls"
      subtitle="Control the behavior of the test buttons below using these controls"
      controlButtons={controlButtons}
    >
      <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">Foresight Test Buttons</h2>

      {/* Foresight Buttons Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
        <div className={`flex flex-col items-center space-y-4 ${isVisible ? "" : "hidden"}`}>
          <h3 className="text-lg font-semibold text-slate-700">Visibility Test</h3>
          <div className="flex items-center justify-center">
            <ForesightButtonVisibility isVisible={isVisible} />
          </div>
          <p className="text-sm text-slate-600 text-center max-w-32">
            Tests DOM removal causing layout shifts
          </p>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-lg font-semibold text-slate-700">Resize Test</h3>
          <div className="flex items-center justify-center">
            <ForesightButtonResizeable isResized={isResized} />
          </div>
          <p className="text-sm text-slate-600 text-center max-w-32">
            Tests element boundary updates
          </p>
        </div>

        {!shouldBeRemoved && (
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold text-slate-700">Remove Test</h3>
            <div className="flex items-center justify-center min-h-[160px]">
              <ForesightButtonRemoveable shouldBeRemoved={shouldBeRemoved} />
            </div>
            <p className="text-sm text-slate-600 text-center max-w-32">
              Tests complete element removal
            </p>
          </div>
        )}

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
    </PageLayout>
  )
}
