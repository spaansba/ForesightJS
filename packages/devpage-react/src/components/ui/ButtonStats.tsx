type ButtonStatsProps = {
  hitCount: number
  isPredicted: boolean
  isCallbackRunning: boolean
  status: string | undefined
}

const row = (label: string, value: React.ReactNode) => {
  return (
    <div className="flex justify-between px-2 py-1">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  )
}

const ButtonStats = ({ hitCount, isPredicted, isCallbackRunning, status }: ButtonStatsProps) => {
  return (
    <div className="w-56 font-mono text-[11px] border border-gray-300 divide-y divide-gray-200 bg-white">
      {row("hits", hitCount)}
      {row("predicted", isPredicted ? "yes" : "no")}
      {row("cb running", isCallbackRunning ? "yes" : "no")}
      {row("status", status ?? "—")}
    </div>
  )
}

export default ButtonStats
