import styles from "../../styles.module.css"
import { ForesightCard } from "./ForesightCard"
import { HoverCard } from "./HoverCard"
import { RegularCard } from "./RegularCard"

function MouseCardsWrapper() {
  return (
    <div className={styles.loadingComparisonSection}>
      <div className={styles.comparisonHeader}>
        <h2>Playground</h2>
        <p className={styles.comparisonDescription}>
          Experience the difference between traditional prefetching methods and ForesightJS's intelligent mouse tracking.
        </p>
      </div>
      <div className={styles.demoCardGrid}>
        <div className={styles.demoTraditionalWrapper}>
          <div className={styles.sectionHeader}>
            <h3>Traditional Prefetching</h3>
          </div>
          <div className={styles.demoCards}>
            <HoverCard />
            <RegularCard />
          </div>
        </div>
        <div className={styles.demoForesightWrapper}>
          <div className={styles.sectionHeader}>
            <h3>ForesightJS Prefetching</h3>
          </div>
          <div className={styles.demoCards}>
            <ForesightCard />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MouseCardsWrapper
