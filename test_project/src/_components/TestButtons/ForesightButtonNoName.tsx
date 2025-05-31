import React from "react"
import BaseForesightButton from "./BaseForesightButton"

function ForesightButtonNoName() {
  return (
    <div className="size-20 bg-purple-200">
      <BaseForesightButton
        registerOptions={{
          callback: () => {
            console.log("no name button")
          },
          hitSlop: 20,
          unregisterOnCallback: true,
        }}
      />
    </div>
  )
}

export default ForesightButtonNoName
