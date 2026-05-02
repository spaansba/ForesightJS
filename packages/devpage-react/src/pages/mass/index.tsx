import { ForesightManager } from "@foresightjs/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useDebug } from "../../contexts/DebugContext"

const Mass = () => {
  const [resetKey, setResetKey] = useState(0)
  const [hitCount, setHitCount] = useState(0)
  const [buttonCount, setButtonCount] = useState(1000)
  const { isDebugActive, setDebugMode } = useDebug()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDebugMode(false)
  }, [setDebugMode])

  const resetTest = useCallback(() => {
    setResetKey(prev => prev + 1)
    setHitCount(0)
  }, [])

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const buttons = containerRef.current.querySelectorAll("[data-foresight-btn]")

    const HIT_CLASSES = ["bg-emerald-500", "text-white", "border-emerald-600"]
    const UNHIT_CLASSES = ["bg-white", "text-gray-700", "border-gray-300"]

    ForesightManager.instance.register({
      element: buttons,
      callback: ({ element }) => {
        element.classList.remove(...UNHIT_CLASSES)
        element.classList.add(...HIT_CLASSES)
        setHitCount(prev => prev + 1)
      },
      hitSlop: 0,
    })
  }, [resetKey, buttonCount])

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

      {isDebugActive && (
        <div className="mb-6 border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Debug mode is on with {buttonCount.toLocaleString()} elements — the overlay can tank frame
          rates.
        </div>
      )}

      <div ref={containerRef} className="flex flex-wrap gap-1">
        {Array.from({ length: buttonCount }, (_, i) => (
          <button
            key={`${resetKey}-${i}`}
            data-foresight-btn
            className="flex justify-center items-center size-10 text-xs font-medium bg-white text-gray-700 border border-gray-300"
          >
            {i}
          </button>
        ))}
      </div>
    </main>
  )
}

export default Mass
