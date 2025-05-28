import { useState } from "react"
import ForesightButtonRegular from "./TestButtons/ForesightButtonRegular"
import ForesightButtonResizeable from "./TestButtons/ForesightButtonResizeable"
import ForesightButtonToggelable from "./TestButtons/ForesightButtonToggelable"
import FakeButton from "./TestButtons/FakeButton"

export const Main = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [isResized, setIsResized] = useState(false)
  return (
    <div className="p-5 font-sans">
      <div className="flex gap-4 flex-row">
        <FakeButton />
        <FakeButton />
        <button
          onClick={() => {
            setIsVisible(!isVisible)
          }}
          id="Visibility"
          className="size-20 bg-amber-200"
        >
          Toggle Visibility
        </button>
        <button
          onClick={() => {
            setIsResized(!isResized)
          }}
          className="size-20 bg-amber-200"
          id="Resize"
        >
          Toggle Resize
        </button>
      </div>
      <div className="flex gap-20 flex-row mt-4 justify-center items-center">
        <ForesightButtonToggelable isVisible={isVisible} />
        <ForesightButtonResizeable isResized={isResized} />
        <ForesightButtonRegular />
      </div>
    </div>
  )
}
