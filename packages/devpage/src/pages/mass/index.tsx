import { ForesightManager } from "js.foresight"
import { ForesightDevtools } from "js.foresight-devtools"
import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

function Mass() {
  const [resetKey, setResetKey] = useState(0)
  const [hitCount, setHitCount] = useState(0)
  const [debugEnabled, setDebugEnabled] = useState(false)
  ForesightDevtools.instance.alterDevtoolsSettings({
    showDebugger: debugEnabled,
  })
  const handleHit = useCallback(() => setHitCount(prev => prev + 1), [])

  const buttons = Array.from({ length: 1000 }, (_, i) => (
    <SmallButton key={`${resetKey}-${i}`} name={i} onHit={handleHit} />
  ))

  const toggleDebug = () => {
    const newDebugState = !debugEnabled
    setDebugEnabled(newDebugState)
    ForesightDevtools.instance.alterDevtoolsSettings({
      showDebugger: newDebugState,
    })
  }

  const resetTest = () => {
    setResetKey(prev => prev + 1)
    setHitCount(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
              <div className="flex gap-3">
                <Link 
                  to="/images" 
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Images
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl px-6 py-3 shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{hitCount}</div>
                  <div className="text-xs text-green-100 font-medium">Callbacks Hit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mass Performance Test
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Testing ForesightJS performance with 1,000 registered elements. 
            Hover over buttons to trigger callbacks and watch the counter.
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-8">
          <div className="flex items-center justify-center gap-6">
            <button
              className={`
                relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105
                ${debugEnabled 
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg" 
                  : "bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg"
                }
              `}
              onClick={toggleDebug}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                {debugEnabled ? "Debug ON" : "Debug OFF"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
            
            <button
              className="relative overflow-hidden px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transition-all duration-300 transform hover:scale-105"
              onClick={resetTest}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Test
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </div>
        </div>

        {/* Performance Info */}
        <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-blue-200/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Performance Testing</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            This test validates ForesightJS performance with many registered elements. 
            Each button is individually registered and responds to mouse predictions. 
            Enable debug mode to visualize trajectory calculations.
          </p>
        </div>
      </div>

      {/* Button Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
          <div className="flex flex-wrap gap-2 justify-center">
            {buttons}
          </div>
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
        relative flex justify-center items-center size-10 rounded-lg text-sm font-medium transition-all duration-300 transform
        ${isHit 
          ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white scale-110 shadow-lg ring-2 ring-green-300/50" 
          : "bg-white hover:bg-gray-50 text-gray-700 hover:scale-105 shadow-sm border border-gray-200/60 hover:border-gray-300 hover:shadow-md"
        }
      `}
    >
      <span className="relative z-10 text-center leading-tight">
        {name}
      </span>
      {isHit && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-lg animate-pulse"></div>
      )}
    </button>
  )
}

export default Mass
