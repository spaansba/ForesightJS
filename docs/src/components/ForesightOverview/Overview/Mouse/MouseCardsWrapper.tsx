import styles from "../../styles.module.css"
import { ForesightCard } from "./ForesightCard"
import { HoverCard } from "./HoverCard"
import { RegularCard } from "./RegularCard"

function MouseCardsWrapper() {
  return (
    <div className={styles.loadingComparisonSection}>
      <div className={styles.cardGrid}>
        <HoverCard />
        <RegularCard />
        <ForesightCard />
      </div>
    </div>
  )
}

export default MouseCardsWrapper
