import { useIsResized } from "../../stores/ButtonStateStore"
import BaseForesightButton from "./BaseForesightButton"

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
      <p className="text-sm text-slate-600 text-center max-w-32">
        Tests element boundary updates
      </p>
    </div>
  )
}

export default ForesightButtonResizeable
