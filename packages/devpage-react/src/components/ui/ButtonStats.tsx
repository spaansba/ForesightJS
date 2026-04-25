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
  const isPredicted = state?.isPredicted ?? false
  const hitCount = state?.hitCount ?? 0
  const status = state?.status ?? "—"
  return (
    <dl className="w-40 font-mono text-[11px] border border-gray-300 divide-y divide-gray-200 bg-white">
      {row("hits", hitCount)}
      {row("predicted", isPredicted ? "yes" : "no")}
      {row("status", status)}
    </dl>
  )
}

export default ButtonStats
