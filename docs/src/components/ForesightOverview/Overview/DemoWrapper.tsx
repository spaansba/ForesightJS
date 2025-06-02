import MobileMessage from "../MobileMessage"
import styles from "../styles.module.css"

import Playground from "./Playground/Playground"
function DemoWrapper() {
  return (
    <>
      <div className={styles.mobileMessage}>
        <MobileMessage />
      </div>
      <div className={styles.demoSection}>
        <div className={styles.demoHeader}>
          <h2>Playground</h2>
        </div>
        <p>
          This interactive demo compares ForesightJS's mouse and tab tracking with traditional
          prefetching approaches. Each button simulates a 300ms server response delay to demonstrate
          real-world fetching scenarios. ForesightJS is fully configurable. To explore all settings
          you can open the debugger in the bottom right corner while debug mode is on. To experience
          the app as an end user would, turn off debug mode.
        </p>
        <Playground />
      </div>
    </>
  )
}

export default DemoWrapper
