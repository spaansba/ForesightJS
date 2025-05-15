import React from "react"
import styles from "../styles.module.css"
import MobileMessage from "../MobileMessage"
function ComparisonInfo() {
  return (
    <>
      <div className={styles.comparisonInfo}>
        <h2>Loading Strategy Comparison</h2>

        <ul className={styles.comparisonList}>
          <li>
            <strong>Regular:</strong> Loads data only when clicked
          </li>
          <li>
            <strong>On Hover:</strong> Loads data only after hovering
          </li>
          <li>
            <strong>ForesightJS:</strong> Loads data when the mouse trajectory predicts you'll
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
