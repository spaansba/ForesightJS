import BaseForesightButton from "./BaseForesightButton"
import ForesightButtonParagraph from "./ForesightButtonParagraph"

function ForesightButtonNoName() {
  return (
    <div className="flex flex-col items-center space-y-4">
      <h3 className="text-lg font-semibold text-slate-700">No Name Test</h3>
      <div className="bg-gradient-to-br from-purple-200 to-purple-300 size-40 rounded-lg shadow-md border border-purple-300">
        <BaseForesightButton
          registerOptions={{
            callback: () => {
              console.log("no name button")
            },
            hitSlop: 20,
            unregisterOnCallback: true,
          }}
        />
        <ForesightButtonParagraph paragraph="Tests unnamed element handling" />
      </div>
    </div>
  )
}

export default ForesightButtonNoName
