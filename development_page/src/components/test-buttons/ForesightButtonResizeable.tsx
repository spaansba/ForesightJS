import { useIsResized } from "../../stores/ButtonStateStore"
import BaseForesightButton from "./BaseForesightButton"
import ForesightButtonParagraph from "./ForesightButtonParagraph"

function ForesightButtonResizeable() {
  const isResized = useIsResized()
  return (
    <div className="flex flex-col items-center space-y-4">
      <h3 className="text-lg font-semibold text-slate-700">Resize Test</h3>
      <div
        className={`${
          isResized ? "size-40" : "size-20"
        } bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg shadow-md border border-blue-300 transition-all duration-500`}
      >
        <BaseForesightButton
          registerOptions={{
            callback: () => {
              console.log("resizeable")
            },
            hitSlop: 30,
            name: "resizeable",
            unregisterOnCallback: true,
          }}
        />
      </div>
      <ForesightButtonParagraph paragraph="Tests element boundary updates, check if the ResizeObserver is doing its work correctly by recalculating all element bounds on resize" />
    </div>
  )
}

export default ForesightButtonResizeable
