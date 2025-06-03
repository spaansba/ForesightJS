import { useIsVisible } from "../../stores/ButtonStateStore"
import BaseForesightButton from "./BaseForesightButton"

function ForesightButtonVisibility() {
  const isVisible = useIsVisible()
  return (
    <div className={`flex flex-col items-center space-y-4 ${isVisible ? "" : "hidden"}`}>
      <h3 className="text-lg font-semibold text-slate-700">Visibility Test</h3>
      <div className="bg-gradient-to-br from-amber-200 to-amber-300 size-40 rounded-lg shadow-md border border-amber-300">
        <BaseForesightButton
          registerOptions={{
            callback: () => {
              console.log("visibility")
            },
            hitSlop: 0,
            name: "visibility",
            unregisterOnCallback: true,
          }}
        />
      </div>
      <p className="text-sm text-slate-600 text-center max-w-32">
        Tests DOM removal causing layout shifts
      </p>
    </div>
  )
}

export default ForesightButtonVisibility
