import DebugButton from "../DebugButton"
import MobileMessage from "../MobileMessage"
import styles from "../styles.module.css"
import KeyboardCardsWrapper from "./Keyboard/KeyboardCardsWrapper"
import { useState } from "react"
import MouseCardsWrapper from "./Mouse/MouseCardsWrapper"
import ResetCardsButton from "./Mouse/ResetCardsButton"
function DemoWrapper() {
  const [resetTrigger, setResetTrigger] = useState(0)
  const handleResetAll = () => {
    setResetTrigger((prev) => prev + 1)
  }
  return (
    <div className={styles.demoSection}>
      <div className={styles.demoHeader}>
        <h2>Playground</h2>
      </div>
      <div className={styles.mobileMessage}>
        <MobileMessage />
      </div>
      <p className={styles.demoDescription}>
        This demo shows how ForesightJS improves on traditional loading strategies. All cards have a
        300ms fetch delay to simulate loading data from a server. Below are 25 buttons to show how
        ForesightJS handles keyboard users. Try (reverse) tabbing through the buttons and see what
        happends.
      </p>

      <div className={styles.comparisonContainer}>
        <MouseCardsWrapper key={`foresight-mouse-${resetTrigger}`} />
        <KeyboardCardsWrapper key={`foresight-keyboard-${resetTrigger}`} />
      </div>
      <div className={styles.controlsContainer}>
        <ResetCardsButton onReset={handleResetAll} />
        <DebugButton />
      </div>
    </div>
  )
}

export default DemoWrapper
