import React, { useState } from "react"
import { RegularCard } from "./RegularCard"
import { HoverCard } from "./HoverCard"
import { ForesightCard } from "./ForesightCard"
import styles from "../../styles.module.css"
import useDebugMode from "@site/src/hooks/useDebugMode"
function CardsWrapper() {
  const { toggleDebugMode, debugMode } = useDebugMode()
  const [resetTrigger, setResetTrigger] = useState(0)

  const handleResetAll = () => {
    setResetTrigger((prev) => prev + 1)
  }

  const resetButtonText = "Reset All Cards"
  return (
    <div className={styles.loadingComparisonSection}>
      <div className={styles.controlsContainer}>
        <button className={styles.resetAllButton} onClick={handleResetAll}>
          {resetButtonText}
        </button>
        <div className={styles.debugButtonContainer}>
          <button
            className={`${styles.debugButton} ${debugMode ? styles.active : ""}`}
            onClick={toggleDebugMode}
          >
            Debug Mode: {debugMode ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div className={styles.cardGrid}>
        <RegularCard key={`regular-${resetTrigger}`} />
        <HoverCard key={`hover-${resetTrigger}`} />
        <ForesightCard key={`foresight-${resetTrigger}`} />
      </div>

      <div className={styles.comparisonNote}>
        <p>
          <strong>Try it:</strong> Move your cursor toward the ForeSightJs card from different
          angles. Notice how it starts loading <strong>before</strong> you hover over it!
        </p>
      </div>
    </div>
  )
}

export default CardsWrapper
