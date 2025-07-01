import { ForesightManager } from "js.foresight"
import { useState, useEffect } from "react"

function useDebugMode() {
  const [debugMode, setDebugMode] = useState(true)
  useEffect(() => {
    ForesightManager.instance.alterGlobalSettings({
      debug: debugMode,
    })
  }, [debugMode])

  const toggleDebugMode = () => {
    setDebugMode(!debugMode)
  }

  return { toggleDebugMode, debugMode }
}

export default useDebugMode
