import type { ForesightRegisterOptionsWithoutElement } from "js.foresight"
import useForesight from "../../hooks/useForesight"

type ForesightButtonProps = {
  registerOptions: ForesightRegisterOptionsWithoutElement
}

function ForesightButton({ registerOptions }: ForesightButtonProps) {
  const { elementRef, state } = useForesight<HTMLButtonElement>(registerOptions)
  const isPredicted = state?.isPredicted ?? false
  const hitCount = state?.hitCount ?? 0
  const hasError = state?.lastStatus === "error"
  return (
    <button
      ref={elementRef}
      id={registerOptions.name}
      data-predicted={isPredicted}
      className={`flex flex-col justify-center items-center h-full w-full rounded-lg text-slate-800 font-semibold text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${
        isPredicted ? "ring-2 ring-amber-400 bg-amber-100" : ""
      }`}
    >
      <span className="text-center leading-tight">{registerOptions.name || "Unnamed"}</span>
      <span className="text-[10px] font-mono text-slate-500 mt-1">
        hits:{hitCount} {isPredicted ? "· predicting" : ""}
        {hasError ? " · err" : ""}
      </span>
    </button>
  )
}

export default ForesightButton
