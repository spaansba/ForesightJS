import BaseForesightButton from "./BaseForesightButton"
import ForesightButtonParagraph from "./ForesightButtonParagraph"

function ForesightButtonNoName() {
  return (
    <div className="flex flex-col items-center space-y-4">
      <h3 className="text-lg font-semibold ">No Name Test</h3>
      <div className="size-40 rounded-lg shadow-md bg-neutral-600">
        <BaseForesightButton
          registerOptions={{
            callback: async () => {
              const randomTimeout = Math.floor(Math.random() * 1000)
              await new Promise(resolve => setTimeout(resolve, randomTimeout))
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
