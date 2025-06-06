import { useIsVisible } from "../../stores/ButtonStateStore"
import BaseForesightButton from "./BaseForesightButton"
import ForesightButtonParagraph from "./ForesightButtonParagraph"

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
      <ForesightButtonParagraph
        paragraph="Tests DOM removal causing layout shifts. The MutationObserver should NOT remove this element
      since we are just toggling visibility"
      />
    </div>
  )
}

export default ForesightButtonVisibility
