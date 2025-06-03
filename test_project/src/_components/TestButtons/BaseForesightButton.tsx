import { useEffect, useRef } from "react"
import { ForesightManager } from "../../../../src/ForesightManager/Manager/ForesightManager"
import type { ForesightRegisterOptionsWithoutElement } from "../../../../src/types/types"

type ForesightButtonProps = {
  registerOptions: ForesightRegisterOptionsWithoutElement
}

function ForesightButton({ registerOptions }: ForesightButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!buttonRef.current) {
      return
    }

    ForesightManager.instance.register({
      element: buttonRef.current,
      ...registerOptions,
    })
  }, [buttonRef, registerOptions])

  return (
    <button
      ref={buttonRef}
      id={registerOptions.name}
      className="flex justify-center items-center h-full w-full"
    >
      <span>{registerOptions.name}</span>
    </button>
  )
}

export default ForesightButton
