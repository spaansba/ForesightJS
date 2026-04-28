import type { ForesightRegisterOptionsWithoutElement } from "@foresightjs/react"
import { useForesight } from "@foresightjs/react"
import ButtonStats from "../ui/ButtonStats"
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
        data-predicted={isPredicted}
        className={`flex items-center justify-center text-slate-900 font-medium text-sm focus:outline-none ${
          isPredicted ? "outline outline-2 outline-amber-500" : ""
        } ${className}`}
      >
        {children ?? (
          <span className="text-center leading-tight">{registerOptions.name || "Unnamed"}</span>
        )}
      </button>
      <ButtonStats
        hitCount={hitCount}
        isPredicted={isPredicted}
        isCallbackRunning={isCallbackRunning}
        status={status}
      />
    </>
  )
}

export default ForesightButton
