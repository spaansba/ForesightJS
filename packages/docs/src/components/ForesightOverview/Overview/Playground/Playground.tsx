import styles from "../../styles.module.css"
import keyboardStyles from "../Keyboard/styles.module.css"
import { ForesightCard } from "../Mouse/ForesightCard"
import { HoverCard } from "../Mouse/HoverCard"
import { RegularCard } from "../Mouse/RegularCard"
import SmallButton from "../Keyboard/SmallButton"

import ResetCardsButton from "../Mouse/ResetCardsButton"
import DebugButton from "../../DebugButton"
import { useState } from "react"

function Playground() {
  const [resetTrigger, setResetTrigger] = useState(0)
  const handleResetAll = () => {
    setResetTrigger(prev => prev + 1)
  }
  const buttonIds = Array.from({ length: 27 }, (_, i) => `btn-${i + 1}`)

  return (
    <>
      {/* Mouse Cards Comparison */}
      <div className={styles.demoCardGrid}>
        <div className={styles.demoTraditionalWrapper}>
          <div className={styles.sectionHeader}>
            <h3>Traditional Prefetching</h3>
          </div>
          <div className={styles.demoCards}>
            <HoverCard key={`HoverCard-${resetTrigger}`} />
            <RegularCard key={`RegularCard-${resetTrigger}`} />
          </div>
        </div>
        <div className={styles.demoForesightWrapper}>
          <div className={styles.sectionHeader}>
            <h3>ForesightJS Prefetching</h3>
          </div>
          <div className={styles.demoCards}>
            <ForesightCard key={`ForesightCard-${resetTrigger}`} />
          </div>
        </div>
      </div>

      <div className={styles.sectionDivider}>
        <>
          <ResetCardsButton onReset={handleResetAll} />
          <DebugButton />
        </>
      </div>

      {/* Keyboard Navigation Section */}
      <div key={`playground-${resetTrigger}`} className={styles.keyboardSection}>
        <div className={keyboardStyles.buttonGrid}>
          {buttonIds.map((id, index) => (
            <SmallButton key={id} index={index} />
          ))}
        </div>
        <div className={styles.keyboardTip}>
          <strong>TIP:</strong> Try using <kbd>Tab</kbd> and <kbd>Shift+Tab</kbd> to navigate
          through the buttons above
        </div>
        <div className={styles.keyboardTip}>
          <strong>TIP:</strong> Install{" "}
          <a href="/docs/debugging/devtools" style={{ color: "#7dd3fc" }}>
            Development Tools
          </a>{" "}
          for visual feedback and real-time tuning
        </div>
        <div className={styles.keyboardTip}>
          <strong>INFO:</strong> Element overlays might lag behind since we use RAF and async
          techniques. This actually means the core package is optimized for performance.
        </div>
      </div>
    </>
  )
}

export default Playground
