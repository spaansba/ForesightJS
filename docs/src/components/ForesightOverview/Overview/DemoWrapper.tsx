import DebugButton from "../DebugButton"
import MobileMessage from "../MobileMessage"
import styles from "../styles.module.css"
import CardsWrapper from "./Cards/CardsWrapper"
function DemoWrapper() {
  return (
    <div className={styles.demoSection}>
      <div className={styles.demoHeader}>
        <h2>Try It Yourself</h2>
        <DebugButton />
      </div>
      <div className={styles.mobileMessage}>
        <MobileMessage />
      </div>
      <p className={styles.demoDescription}>
        This demo shows how ForesightJS improves on traditional loading strategies. All cards have a
        300ms fetch delay to simulate loading data from a server.
      </p>

      <div className={styles.comparisonContainer}>
        <CardsWrapper />
      </div>
    </div>
  )
}

export default DemoWrapper
