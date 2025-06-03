import { useState } from "react"
import ForesightButtonRegular from "./TestButtons/ForesightButtonRegular"
import ForesightButtonResizeable from "./TestButtons/ForesightButtonResizeable"
import ForesightButtonVisibility from "./TestButtons/ForesightButtonVisibility"
import ForesightButtonRemoveable from "./TestButtons/ForesightButtonRemoveable"
import { Link } from "react-router-dom"
import ForesightButtonNoName from "./TestButtons/ForesightButtonNoName"

export const Main = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [isResized, setIsResized] = useState(false)
  const [shouldBeRemoved, setShouldBeRemoved] = useState(false)
  return (
    <div className="p-5 font-sans">
      <div className="flex gap-4 flex-row">
        <Link className="size-30 bg-green-200 flex justify-center items-center" to="/other">
          Switch to other page
        </Link>
        <button
          onClick={() => {
            setIsVisible(!isVisible)
          }}
          id="Visibility"
          className={`size-30 ${isVisible ? "bg-blue-400" : "bg-gray-400"}`}
        >
          Visibility: {isVisible.toString()}
        </button>
        <button
          onClick={() => {
            setIsResized(!isResized)
          }}
          className={`size-30 ${isResized ? "bg-blue-400" : "bg-gray-400"}`}
          id="Resize"
        >
          Resize: {isResized.toString()}
        </button>
        <button
          onClick={() => {
            setShouldBeRemoved(!shouldBeRemoved)
          }}
          className={`size-30 ${shouldBeRemoved ? "bg-blue-400" : "bg-gray-400"}`}
          id="Remove"
        >
          Remove: {shouldBeRemoved.toString()}
        </button>
      </div>
      <div className="flex gap-20 flex-wrap mt-50 justify-center items-center">
        <ForesightButtonVisibility isVisible={isVisible} />
        <ForesightButtonResizeable isResized={isResized} />
        <ForesightButtonRemoveable shouldBeRemoved={shouldBeRemoved} />
        <ForesightButtonNoName />
        {/* <ForesightButtonRegular /> */}
      </div>
    </div>
  )
}
