import React from "react"
import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonResizeableProps = {
  isResized: boolean
}

function ForesightButtonResizeable({ isResized }: ForesightButtonResizeableProps) {
  return (
    <div className={`${isResized ? "size-40" : "size-20"} bg-blue-200`}>
      <BaseForesightButton
        registerOptions={{
          element: null,
          callback: () => {
            console.log("resizeable")
          },
          hitSlop: 30,
          name: "resizeable",
          unregisterOnCallback: true,
        }}
      ></BaseForesightButton>
    </div>
  )
}

export default ForesightButtonResizeable
