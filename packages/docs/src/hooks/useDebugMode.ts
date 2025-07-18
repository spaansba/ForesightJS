import { ForesightDevtools } from "js.foresight-devtools"
import { useState, useEffect } from "react"

function useDebugMode() {
  const [debugMode, setDebugMode] = useState(true)
  useEffect(() => {
    ForesightDevtools.instance.alterDevtoolsSettings({ showDebugger: debugMode })
  }, [debugMode])

  const toggleDebugMode = () => {
    setDebugMode(!debugMode)
  }

  return { toggleDebugMode, debugMode }
}

export default useDebugMode
