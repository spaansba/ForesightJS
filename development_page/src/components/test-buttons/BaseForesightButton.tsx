import { useEffect, useRef } from "react"
import { ForesightManager } from "../../../../src/Manager/ForesightManager"
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
    return () => {
      // Test without unregister
      // unregister()
    }
  }, [buttonRef, registerOptions])

  return (
    <button
      ref={buttonRef}
      id={registerOptions.name}
      className="flex justify-center items-center h-full w-full rounded-lg text-slate-800 font-semibold text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
    >
      <span className="text-center leading-tight">{registerOptions.name || "Unnamed"}</span>
    </button>
  )
}

export default ForesightButton
