import { ForesightManager } from "js.foresight"
import { useCallback, useEffect, useRef, useState } from "react"
import { SimpleNavigation } from "../../components/SimpleNavigation"
import { useDebug } from "../../contexts/DebugContext"

function Mass() {
  const [resetKey, setResetKey] = useState(0)
  const [hitCount, setHitCount] = useState(0)
  const [buttonCount, setButtonCount] = useState(1000)
  const handleHit = useCallback(() => setHitCount(prev => prev + 1), [])
  const { isDebugActive, setDebugMode } = useDebug()

  // Automatically disable debug mode when entering mass page
  useEffect(() => {
    setDebugMode(false)
  }, [setDebugMode])

  const resetTest = useCallback(() => {
    setResetKey(prev => prev + 1)
    setHitCount(0)
  }, [])

  const buttons = Array.from({ length: buttonCount }, (_, i) => (
    <SmallButton key={`${resetKey}-${i}`} name={i} onHit={handleHit} />
  ))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      <SimpleNavigation
        onReset={resetTest}
        hitCount={hitCount}
        buttonCount={buttonCount}
        setButtonCount={setButtonCount}
      />

      {/* Title Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mass Performance Test</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Testing ForesightJS performance with {buttonCount.toLocaleString()} registered elements.
            Hover over buttons to trigger callbacks and watch the counter.
          </p>
        </div>

        {/* Performance Warning - Only show when debug is active */}
        {isDebugActive && (
          <div className="bg-amber-50/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-amber-200/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.98 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-amber-900">Debug Mode Active</h3>
            </div>
            <p className="text-amber-700 leading-relaxed">
              <strong>
                Debug mode with {buttonCount.toLocaleString()} elements may significantly impact
                performance.
              </strong>{" "}
              The visual debugging overlay can cause reduced frame rates and browser responsiveness.
              Consider testing with fewer elements when debugging.
            </p>
          </div>
        )}
      </div>

      {/* Button Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
          <div className="flex flex-wrap gap-2 justify-center">{buttons}</div>
        </div>
      </div>
    </div>
  )
}

function SmallButton({ name, onHit }: { name: number; onHit: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isHit, setIsHit] = useState(false)

  useEffect(() => {
    if (!buttonRef.current) {
      return
    }
    ForesightManager.instance.register({
      element: buttonRef.current,
      callback: () => {
        onHit()
        setIsHit(true)
      },
      name: name.toString(),
      hitSlop: 0,
    })

    return () => {}
  }, [name])

  return (
    <button
      ref={buttonRef}
      className={`
        flex justify-center items-center size-10 rounded-lg text-sm font-medium
        ${
          isHit
            ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg ring-2 ring-green-300/50"
            : "bg-white text-gray-700 shadow-sm border border-gray-200/60"
        }
      `}
    >
      <span className="text-center leading-tight">{name}</span>
    </button>
  )
}

export default Mass
