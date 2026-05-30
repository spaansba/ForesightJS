import { useState } from "react"
import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonEnabledProps = {
  name: string
}

const ForesightButtonEnabled = ({ name }: ForesightButtonEnabledProps) => {
  const [enabled, setEnabled] = useState(true)

  return (
    <article className="flex flex-col items-center gap-3 w-40">
      <h4 className="text-sm font-medium text-gray-900 self-start">Enabled</h4>
      <BaseForesightButton
        className={`size-40 ${enabled ? "bg-teal-200" : "bg-gray-300 text-gray-500"}`}
        registerOptions={{
          callback: async () => {
            const randomTimeout = Math.floor(Math.random() * 1000)
            await new Promise(resolve => setTimeout(resolve, randomTimeout))
          },
          hitSlop: 20,
          name,
          enabled,
        }}
      >
        <span className="text-center leading-tight">{enabled ? name : "disabled"}</span>
      </BaseForesightButton>
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
