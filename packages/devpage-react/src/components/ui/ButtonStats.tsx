import type { ForesightElementState } from "js.foresight"

type ButtonStatsProps = {
  state: ForesightElementState | null
}

function row(label: string, value: React.ReactNode) {
  return (
    <div className="flex justify-between px-2 py-1">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  )
}

function ButtonStats({ state }: ButtonStatsProps) {
  return (
    <div className="w-56 font-mono text-[11px] border border-gray-300 divide-y divide-gray-200 bg-white">
      {row("hits", state?.hitCount ?? 0)}
      {row("predicted", state?.isPredicted ? "yes" : "no")}
      {row("cb running", state?.isCallbackRunning ? "yes" : "no")}
      {row("status", state?.status ?? "—")}
      <details className="divide-y divide-gray-200">
        <summary className="px-2 py-1 cursor-pointer text-gray-500 select-none">full state</summary>
        <pre className="px-2 py-1 overflow-auto max-h-60 text-[10px] text-gray-700">
          {state ? JSON.stringify(state, null, 2) : "null"}
        </pre>
      </details>
    </div>
  )
}

export default ButtonStats
