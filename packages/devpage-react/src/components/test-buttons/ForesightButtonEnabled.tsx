import { useState } from "react"
import { useForesight } from "@foresightjs/react"
import ButtonStats from "../ui/ButtonStats"
import { useReactivateAfter } from "../../stores/ButtonStateStore"

type ForesightButtonEnabledProps = {
  name: string
}

const ForesightButtonEnabled = ({ name }: ForesightButtonEnabledProps) => {
  const [enabled, setEnabled] = useState(true)
  const reactivateAfter = useReactivateAfter()

  const { elementRef, isPredicted, hitCount, isCallbackRunning, status } =
    useForesight<HTMLButtonElement>({
      callback: async () => {
        const randomTimeout = Math.floor(Math.random() * 1000)
        await new Promise(resolve => setTimeout(resolve, randomTimeout))
      },
      hitSlop: 20,
      name,
      reactivateAfter,
      enabled,
    })

  return (
    <article className="flex flex-col items-center gap-3 w-40">
      <h4 className="text-sm font-medium text-gray-900 self-start">Enabled</h4>
      <button
        ref={elementRef}
        id={name}
        data-predicted={isPredicted}
        className={`flex items-center justify-center size-40 text-sm font-medium ${
          enabled ? "bg-teal-200 text-slate-900" : "bg-gray-300 text-gray-500"
        } ${isPredicted ? "outline outline-1 outline-amber-500" : ""}`}
      >
        <span className="text-center leading-tight">{enabled ? name : "disabled"}</span>
      </button>
      <ButtonStats
        hitCount={hitCount}
        isPredicted={isPredicted}
        isCallbackRunning={isCallbackRunning}
        status={status}
      />
      <button
        onClick={() => setEnabled(e => !e)}
        className="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
      >
        enabled: {enabled ? "on" : "off"}
      </button>
    </article>
  )
}

export default ForesightButtonEnabled
