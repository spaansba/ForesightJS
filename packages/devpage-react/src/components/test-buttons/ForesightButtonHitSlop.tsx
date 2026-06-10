import { useState } from "react"
import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonHitSlopProps = {
  name: string
}

const ForesightButtonHitSlop = ({ name }: ForesightButtonHitSlopProps) => {
  const [hitSlop, setHitSlop] = useState(20)

  return (
    <article className="flex flex-col items-center gap-3 w-40">
      <h4 className="text-sm font-medium text-gray-900 self-start">Dynamic hitSlop</h4>
      <BaseForesightButton
        className="size-40 bg-indigo-200"
        registerOptions={{
          callback: async () => {
            const randomTimeout = Math.floor(Math.random() * 1000)
            await new Promise(resolve => setTimeout(resolve, randomTimeout))
          },
          hitSlop,
          name,
        }}
      >
        <span className="text-center leading-tight">
          {name} ({hitSlop}px)
        </span>
      </BaseForesightButton>
      <button
        onClick={() => setHitSlop(s => (s === 20 ? 100 : 20))}
        className="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
      >
        hitSlop: {hitSlop}px
      </button>
    </article>
  )
}

export default ForesightButtonHitSlop
