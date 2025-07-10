import useDebugMode from "../../hooks/useDebugMode"
import React from "react"
import styles from "./styles.module.css"
import Tooltip from "./Tooltip"

function DebugButton() {
  const { toggleDebugMode, debugMode } = useDebugMode()

  const tooltipText = debugMode
    ? "Turn off debug mode to see what users experience without visual indicators"
    : "Enable ForesightDevtools to see visual indicators in the bottom-right when ForesightJS predicts user intent"

  return (
    <Tooltip content={tooltipText} position="top">
      <button
        className={`${styles.debugButton} ${debugMode ? styles.active : ""}`}
        onClick={toggleDebugMode}
      >
        Debug Mode: {debugMode ? "on " : "off"}
      </button>
    </Tooltip>
  )
}

export default DebugButton
