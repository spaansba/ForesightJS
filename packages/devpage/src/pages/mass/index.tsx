import { ForesightManager } from "js.foresight"
import { ForesightDevtools } from "js.foresight-devtools"
import { useEffect, useRef, useState } from "react"

function Mass() {
  const [resetKey, setResetKey] = useState(0)
  const buttons = Array.from({ length: 1000 }, (_, i) => (
    <SmallButton key={`${resetKey}-${i}`} name={i} />
  ))

  // No debug settings needed - debugger is separate package

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
          className="size-20 bg-black text-white cursor-pointer rounded flex items-center justify-center font-semibold"
          onClick={() => {
            ForesightDevtools.instance.alterDevtoolsSettings({
              showDebugger: !ForesightDevtools.instance.devtoolsSettings.showDebugger,
            })
          }}
        >
          Debug
        </button>
        <button
          className="size-20 bg-black text-white cursor-pointer rounded flex items-center justify-center font-semibold"
          onClick={() => {
            setResetKey(prev => prev + 1)
          }}
        >
          Reset
        </button>
      </div>
      <div className="flex flex-wrap gap-1 p-4">{buttons}</div>
    </div>
  )
}

function SmallButton({ name }: { name: number }) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!buttonRef.current) {
      return
    }
    ForesightManager.instance.register({
      element: buttonRef.current,
      callback: () => {
        console.log(name)
      },
      name: name.toString(),
      hitSlop: 0,
    })

    return () => {}
  }, [buttonRef, name])

  return (
    <button
      ref={buttonRef}
      className="flex justify-center items-center size-10 rounded-lg text-slate-800 font-semibold text-sm transition-colors duration-200 bg-slate-100 hover:bg-slate-200"
    >
      <span className="text-center leading-tight">{name}</span>
    </button>
  )
}

export default Mass
