import React from "react"
import BaseForesightButton from "./BaseForesightButton"
import ForesightButtonParagraph from "./ForesightButtonParagraph"

type ForesightButtonErrorProps = {
  name: string
}

function ForesightButtonError({ name }: ForesightButtonErrorProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <h3 className="text-lg font-semibold ">Error test button</h3>
      <div className="size-40 rounded-lg shadow-md bg-red-500">
        <BaseForesightButton
          registerOptions={{
            callback: async () => {
              const randomTimeout = Math.floor(Math.random() * 1000)
              await new Promise(resolve => setTimeout(resolve, randomTimeout))
              throw new Error("Test error - callback always fails")
            },
            hitSlop: 20,
            name: name,
          }}
        />
        <ForesightButtonParagraph paragraph="Tests error in callback" />
      </div>
    </div>
  )
}

export default ForesightButtonError
