import { useIsRemoved } from "../../stores/ButtonStateStore"
import BaseForesightButton from "./BaseForesightButton"
function ForesightButtonRemoveable() {
  const shouldBeRemoved = useIsRemoved()

  return (
    <div className="flex flex-col items-center space-y-4">
      {!shouldBeRemoved && (
        <>
          <h3 className="text-lg font-semibold text-slate-700">Remove Test</h3>
          <div className="bg-gradient-to-br from-red-200 to-red-300 size-20 rounded-lg shadow-md border border-red-300">
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
          <p className="text-sm text-slate-600 text-center max-w-32">
            Tests complete element removal
          </p>
        </>
      )}
    </div>
  )
}

export default ForesightButtonRemoveable
