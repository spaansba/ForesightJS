import { useState } from "react"
import styles from "../../styles.module.css"
import { ForesightCard } from "./ForesightCard"
import { HoverCard } from "./HoverCard"
import { RegularCard } from "./RegularCard"
import ResetCardsButton from "./ResetCardsButton"

function CardsWrapper() {
  const [resetTrigger, setResetTrigger] = useState(0)

  const handleResetAll = () => {
    setResetTrigger((prev) => prev + 1)
  }

  return (
    <div className={styles.loadingComparisonSection}>
      <div className={styles.cardGrid}>
        <HoverCard key={`hover-${resetTrigger}`} />
        <RegularCard key={`regular-${resetTrigger}`} />
        <ForesightCard key={`foresight-${resetTrigger}`} />
      </div>
      <div className={styles.controlsContainer}>
        <ResetCardsButton onReset={handleResetAll} />
      </div>
    </div>
  )
}

export default CardsWrapper
