import { ForesightDevtools } from "js.foresight-devtools"
import { useState, useEffect } from "react"

const useDebugMode = () => {
  const [debugMode, setDebugMode] = useState(true)
  useEffect(() => {
    ForesightDevtools.instance.alterDevtoolsSettings({ show: { controlPanel: debugMode } })
  }, [debugMode])

  const toggleDebugMode = () => {
    setDebugMode(!debugMode)
  }

  return { toggleDebugMode, debugMode }
}

export default useDebugMode
