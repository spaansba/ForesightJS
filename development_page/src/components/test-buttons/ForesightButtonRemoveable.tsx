import { useIsRemoved } from "../../stores/ButtonStateStore"
import BaseForesightButton from "./BaseForesightButton"
import ForesightButtonParagraph from "./ForesightButtonParagraph"

type ForesightButtonRemoveableProps = {
  name: string
}

function ForesightButtonRemoveable({ name }: ForesightButtonRemoveableProps) {
  const shouldBeRemoved = useIsRemoved()

  return (
    <div className="flex flex-col items-center space-y-4">
      {!shouldBeRemoved && (
        <>
          <h3 className="text-lg font-semibold ">Remove Test</h3>
          <div className="size-40 shadow-md bg-teal-600 rounded-lg ">
            <BaseForesightButton
              registerOptions={{
                callback: () => {
                  // console.log(name)
                },
                hitSlop: 0,
                name: name,
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
