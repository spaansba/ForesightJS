import MobileMessage from "../MobileMessage"
import styles from "./demowrapper.module.css"
import Playground from "./Playground/Playground"

function DemoWrapper() {
  return (
    <section id="playground" className={styles.playgroundSection}>
      <div className="container">
        <div className={styles.mobileMessage}>
          <MobileMessage />
        </div>

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Playground</h2>
          <p className={styles.sectionSubtitle}>
            See predictions trigger in real-time with{" "}
            <a
              className={styles.inlineLink}
              href="http://localhost:3000/docs/next/getting_started/debug"
              target="_blank"
            >
              Debug Mode
            </a>
            . Move your mouse, scroll or use Tab navigation to experience intent detection.
          </p>
        </div>

        <div className={styles.playgroundContainer}>
          <Playground />
        </div>
      </div>
    </section>
  )
}

export default DemoWrapper
