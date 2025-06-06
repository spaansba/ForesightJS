import { useIsRemoved } from "../../stores/ButtonStateStore"
import BaseForesightButton from "./BaseForesightButton"
import ForesightButtonParagraph from "./ForesightButtonParagraph"
function ForesightButtonRemoveable() {
  const shouldBeRemoved = useIsRemoved()

  return (
    <div className="flex flex-col items-center space-y-4">
      {!shouldBeRemoved && (
        <>
          <h3 className="text-lg font-semibold text-slate-700">Remove Test</h3>
          <div className="bg-gradient-to-br from-red-200 to-red-300 size-40 rounded-lg shadow-md border border-red-300">
            <BaseForesightButton
              registerOptions={{
                callback: () => {
                  console.log("removeable")
                },
                hitSlop: 0,
                name: "removeable",
                unregisterOnCallback: true,
              }}
            />
          </div>
          <ForesightButtonParagraph
            paragraph="  Tests complete element removal for layout shifts but also check if our MutationObserver
            is auto unregistering this element"
          />
        </>
      )}
    </div>
  )
}

export default ForesightButtonRemoveable
