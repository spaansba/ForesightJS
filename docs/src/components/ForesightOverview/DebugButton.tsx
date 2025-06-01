import useDebugMode from "@site/src/hooks/useDebugMode"
import React from "react"
import styles from "./styles.module.css"
function DebugButton() {
  const { toggleDebugMode, debugMode } = useDebugMode()
  return (
    <button
      className={`${styles.debugButton} ${debugMode ? styles.active : ""}`}
      onClick={toggleDebugMode}
    >
      Debug Mode: {debugMode ? "on " : "off"}
    </button>
  )
}

export default DebugButton
