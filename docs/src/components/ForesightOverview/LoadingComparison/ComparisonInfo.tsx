import React from "react"
import styles from "../styles.module.css"
import MobileMessage from "../MobileMessage"
function ComparisonInfo() {
  return (
    <>
      <div className={styles.comparisonInfo}>
        <h2>Loading Strategy Comparison</h2>
        <p>
          This demo shows how ForesightJS improves on traditional loading strategies. All cards have
          a <strong>250ms fetch delay</strong> to simulate loading data from a server:
        </p>
        <ul className={styles.comparisonList}>
          <li>
            <strong>Regular:</strong> <span className={styles.basicTag}>Traditional</span> - Loads
            data only when clicked
          </li>
          <li>
            <strong>On Hover:</strong> <span className={styles.basicTag}>Traditional</span> - Loads
            data only after hovering
          </li>
          <li>
            <strong>ForeSightJS:</strong> Loads data when the mouse trajectory predicts you'll
            interact with the card
          </li>
        </ul>
      </div>

      <div className={styles.mobileMessage}>
        <MobileMessage />
      </div>
    </>
  )
}

export default ComparisonInfo
