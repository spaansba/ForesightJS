import React from "react"
import styles from "../styles.module.css"
import useDebugMode from "@site/src/hooks/useDebugMode"
import { Demo } from "./Demo"
import MobileMessage from "../MobileMessage"
function DemoWrapper() {
  const { toggleDebugMode, debugMode } = useDebugMode()
  return (
    <div className={styles.demoSection}>
      <div className={styles.demoHeader}>
        <h2>Try It Yourself</h2>
        <div className={styles.debugButtonContainer}>
          <button
            className={`${styles.debugButton} ${debugMode ? styles.active : ""}`}
            onClick={toggleDebugMode}
          >
            Debug Mode: {debugMode ? "ON" : "OFF"}
          </button>
        </div>
      </div>
      <div className={styles.mobileMessage}>
        <MobileMessage />
      </div>

      <p className={styles.tryItYourselfText}>
        Move your cursor toward these buttons to see ForesightJS in action with different hit slop
        sizes:
      </p>

      <div className={styles.buttonGrid}>
        <Demo />
      </div>

      <div className={styles.demoNote}>
        <p>
          <strong>Note:</strong> In this demo, <code>unregisterOnCallback</code> is set to{" "}
          <code>false</code> so you can see the prefetch effect multiple times. In a production
          environment, you would typically set it to <code>true</code> (the default) to prefetch
          data only once per element.
        </p>
      </div>

      <p className={styles.demoHint}>
        Each button has a different <code>hitSlop</code> value, which controls how far from the
        element the prediction will trigger. Larger values will activate the button from further
        away. Notice how the buttons light up <strong>before</strong> you hover over them!
      </p>
    </div>
  )
}

export default DemoWrapper
