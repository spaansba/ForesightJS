import { Foresight } from "@foresightjs/react"
import { useCallback, useState } from "react"

const Mass = () => {
  const [resetKey, setResetKey] = useState(0)
  const [hitCount, setHitCount] = useState(0)
  const [buttonCount, setButtonCount] = useState(1000)

  const resetTest = useCallback(() => {
    setResetKey(prev => prev + 1)
    setHitCount(0)
  }, [])

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-1">Mass performance test</h1>
          <p className="text-sm text-gray-600">
            {buttonCount.toLocaleString()} registered elements. Hover to trigger callbacks.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-xs text-gray-700 font-mono">{hitCount} hits</span>
          <label className="flex items-center gap-2 text-xs text-gray-700">
            Count
            <input
              type="number"
              value={buttonCount}
              onChange={e => {
                const value = Math.max(1, Math.min(10000, parseInt(e.target.value) || 1))
                setButtonCount(value)
              }}
              className="w-20 px-2 py-1 text-xs border border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="1"
              max="10000"
            />
          </label>
          <button
            onClick={resetTest}
            className="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
          >
            Reset test
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {/* One Foresight instance per button; changing resetKey remounts them all,
            so every registration starts fresh. */}
        {Array.from({ length: buttonCount }, (_, i) => (
          <Foresight<HTMLButtonElement>
            key={`${resetKey}-${i}`}
            hitSlop={0}
            callback={() => setHitCount(prev => prev + 1)}
          >
            {({ elementRef, isPredicted }) => (
              <button
                ref={elementRef}
                className={`flex justify-center items-center size-10 text-xs font-medium border ${
                  isPredicted
                    ? "bg-emerald-500 text-white border-emerald-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                {i}
              </button>
            )}
          </Foresight>
        ))}
      </div>
    </main>
  )
}

export default Mass
