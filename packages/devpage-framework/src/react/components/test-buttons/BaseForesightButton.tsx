import type { ForesightRegisterOptionsWithoutElement } from "@foresightjs/react"
import { useForesight } from "@foresightjs/react"
import ForesightStats from "../ui/ForesightStats"
import { useReactivateAfter } from "../../stores/ButtonStateStore"

type ForesightButtonProps = {
  registerOptions: ForesightRegisterOptionsWithoutElement
  className?: string
  children?: React.ReactNode
}

const ForesightButton = ({ registerOptions, className = "", children }: ForesightButtonProps) => {
  const reactivateAfter = useReactivateAfter()
  const merged: ForesightRegisterOptionsWithoutElement = {
    reactivateAfter,
    ...registerOptions,
  }
  const { elementRef, isPredicted, hitCount, isCallbackRunning, status } =
    useForesight<HTMLButtonElement>(merged)

  return (
    <>
      <button
        ref={elementRef}
        id={registerOptions.name}
        className={`flex items-center justify-center text-slate-900 font-medium text-sm focus:outline-none ${className}`}
      >
        {children ?? (
          <span className="text-center leading-tight">{registerOptions.name || "Unnamed"}</span>
        )}
      </button>
      <ForesightStats
        hitCount={hitCount}
        isPredicted={isPredicted}
        isCallbackRunning={isCallbackRunning}
        status={status}
      />
    </>
  )
}

export default ForesightButton
