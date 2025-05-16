import React from "react"
import type { ForesightRegisterOptionsWithNullableElement } from "../../../../src/types/types"
import useForesight from "../../hooks/useForesight"

type ForesightButtonProps = {
  registerOptions: ForesightRegisterOptionsWithNullableElement
}

function ForesightButton({ registerOptions }: ForesightButtonProps) {
  const buttonRef = React.useRef<HTMLDivElement>(null)
  const newOptions = {
    ...registerOptions,
    element: buttonRef.current,
  }
  useForesight({ ...newOptions })

  return (
    <div ref={buttonRef} className="flex justify-center items-center h-full w-full">
      <span>{registerOptions.name}</span>
    </div>
  )
}

export default ForesightButton
