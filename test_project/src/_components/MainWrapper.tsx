import { useState } from "react"
import ForesightButtonRegular from "./TestButtons/ForesightButtonRegular"
import ForesightButtonResizeable from "./TestButtons/ForesightButtonResizeable"
import ForesightButtonToggelable from "./TestButtons/ForesightButtonToggelable"

export const Main = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [isResized, setIsResized] = useState(false)
  return (
    <div className="p-5 font-sans">
      <h1 className="text-2xl font-bold mb-3">ForesightManager - React Example</h1>
      <p className="mb-4">
        Hover over the colored boxes to test the ForesightManager functionality.
      </p>
      <div className="flex gap-4 flex-row">
        <button
          onClick={() => {
            setIsVisible(!isVisible)
          }}
          className="size-20 bg-amber-200"
        >
          Toggle Visibility
        </button>
        <button
          onClick={() => {
            setIsResized(!isResized)
          }}
          className="size-20 bg-amber-200"
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
