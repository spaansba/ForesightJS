import { ForesightManager } from "js.foresight"
import { ForesightDevtools } from "js.foresight-devtools"
import { useCallback, useEffect, useRef, useState } from "react"

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
    <div>
      <div className="w-screen h-[200px] flex items-center gap-4 p-4">
        <a
          className="size-20 bg-green-500 flex items-center justify-center text-white font-semibold rounded"
          href="/"
        >
          Back
        </a>
        <button
          className={`size-20 text-white cursor-pointer rounded flex items-center justify-center font-semibold ${
            debugEnabled ? "bg-red-500" : "bg-black"
          }`}
          onClick={toggleDebug}
        >
          Debug
        </button>
        <button
          className="size-20 bg-black text-white cursor-pointer rounded flex items-center justify-center font-semibold"
          onClick={resetTest}
        >
          Reset
        </button>
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-2xl font-bold text-green-600">{hitCount}</div>
          <div className="text-sm text-gray-600">Callbacks Hit</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 p-4">{buttons}</div>
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
      className={`flex justify-center items-center size-10 rounded-lg text-slate-800 font-semibold text-sm transition-all duration-200 ${
        isHit ? "bg-green-400 scale-110 shadow-lg" : "bg-slate-100 hover:bg-slate-200"
      }`}
    >
      <span className="text-center leading-tight">{name}</span>
    </button>
  )
}

export default Mass
