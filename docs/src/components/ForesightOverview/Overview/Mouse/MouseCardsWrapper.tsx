import styles from "../../styles.module.css"
import { ForesightCard } from "./ForesightCard"
import { HoverCard } from "./HoverCard"
import { RegularCard } from "./RegularCard"

function MouseCardsWrapper() {
  return (
    <div className={styles.loadingComparisonSection}>
      <div className={styles.demoCardGrid}>
        <div className={styles.demoTraditionalWrapper}>
          <h3>Traditional Prefetching</h3>
          <div className={styles.demoCards}>
            <HoverCard />
            <RegularCard />
          </div>
        </div>
        <div className={styles.demoForesightWrapper}>
          <h3>ForesightJS Prefetching</h3>
          <div className={styles.demoCards}>
            <ForesightCard />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MouseCardsWrapper
