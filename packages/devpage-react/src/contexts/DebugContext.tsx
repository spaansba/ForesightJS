import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { ForesightDevtools } from "js.foresight-devtools"

interface DebugContextType {
  isDebugActive: boolean
  toggleDebug: () => void
  setDebugMode: (enabled: boolean) => void
}

const DebugContext = createContext<DebugContextType | undefined>(undefined)

export function DebugProvider({ children }: { children: ReactNode }) {
  const [isDebugActive, setIsDebugActive] = useState(
    () => ForesightDevtools.instance.devtoolsSettings.show.controlPanel
  )

  const toggleDebug = useCallback(() => {
    const newState = !isDebugActive
    setIsDebugActive(newState)
    ForesightDevtools.instance.alterDevtoolsSettings({
      show: { controlPanel: newState },
    })
  }, [isDebugActive])

  const setDebugMode = useCallback((enabled: boolean) => {
    setIsDebugActive(enabled)
    ForesightDevtools.instance.alterDevtoolsSettings({
      show: { controlPanel: enabled },
    })
  }, [])

  return (
    <DebugContext.Provider value={{ isDebugActive, toggleDebug, setDebugMode }}>
      {children}
    </DebugContext.Provider>
  )
}

export function useDebug() {
  const context = useContext(DebugContext)
  if (context === undefined) {
    throw new Error("useDebug must be used within a DebugProvider")
  }
  return context
}
