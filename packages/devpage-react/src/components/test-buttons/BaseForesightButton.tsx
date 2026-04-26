import type { ForesightRegisterOptionsWithoutElement } from "js.foresight"
import useForesight from "../../hooks/useForesight"
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
  const { elementRef, state } = useForesight<HTMLButtonElement>(merged)
  const isPredicted = state?.isPredicted ?? false

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
      <ButtonStats state={state} />
    </>
  )
}

export default ForesightButton
