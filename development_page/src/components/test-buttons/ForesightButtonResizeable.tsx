import { useIsResized } from "../../stores/ButtonStateStore"
import BaseForesightButton from "./BaseForesightButton"
import ForesightButtonParagraph from "./ForesightButtonParagraph"

type ForesightButtonResizeableProps = {
  name: string
}

function ForesightButtonResizeable({ name }: ForesightButtonResizeableProps) {
  const isResized = useIsResized()
  return (
    <div className="flex flex-col items-center space-y-4">
      <h3 className="text-lg font-semibold ">Resize Test</h3>
      <div
        className={`${
          isResized ? "size-40" : "size-20"
        }  rounded-lg shadow-md transition-all duration-500 bg-green-600`}
      >
        <BaseForesightButton
          registerOptions={{
            callback: () => {
              // console.log(name)
            },
            hitSlop: 30,
            name: name,
            unregisterOnCallback: true,
          }}
        />
      </div>
      <ForesightButtonParagraph paragraph="Tests element boundary updates, check if the ResizeObserver is doing its work correctly by recalculating all element bounds on resize" />
    </div>
  )
}

export default ForesightButtonResizeable
