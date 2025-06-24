import styles from "./features.module.css"

export function Features() {
  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Prefetch Smarter</h2>
          <p className={styles.sectionSubtitle}>
            Advanced algorithms predict user behavior for smarter prefetching. Framework-agnostic
            with ready-made integrations.
          </p>
        </div>

        <div className={styles.featuresContent}>
          <div className={styles.featureRow}>
            <div className={styles.featureNumber}>01</div>
            <div className={styles.featureInfo}>
              <h3>Mouse Trajectory Prediction</h3>
              <p>
                Analyzes cursor movement patterns using linear extrapolation and the Liang-Barsky
                algorithm to predict where users intend to click before they get there.
              </p>
              <ul className={styles.featureList}>
                <li>Configurable prediction timing</li>
                <li>Hit-slop area expansion</li>
                <li>Viewport intersection optimization</li>
              </ul>
            </div>
          </div>

          <div className={styles.featureRow}>
            <div className={styles.featureNumber}>02</div>
            <div className={styles.featureInfo}>
              <h3>Keyboard Navigation</h3>
              <p>
                Predicts tab navigation patterns for accessibility-first experiences. Supports both
                forward and reverse tabbing with configurable offset prediction.
              </p>
              <ul className={styles.featureList}>
                <li>Tab order detection</li>
                <li>Shift+Tab support</li>
                <li>Tabbable element caching</li>
              </ul>
            </div>
          </div>

          <div className={styles.featureRow}>
            <div className={styles.featureNumber}>03</div>
            <div className={styles.featureInfo}>
              <h3>Scroll-Based Prediction</h3>
              <p>
                Detects scroll direction and velocity to predict which elements will enter the
                viewport, enabling proactive content loading without wasteful eager loading.
              </p>
              <ul className={styles.featureList}>
                <li>Scroll direction analysis</li>
                <li>Viewport intersection tracking</li>
                <li>Configurable scroll margins</li>
              </ul>
            </div>
          </div>

          <div className={styles.featureRow}>
            <div className={styles.featureNumber}>04</div>
            <div className={styles.featureInfo}>
              <h3>Performance Optimized</h3>
              <p>
                Built with performance in mind using efficient observers, minimal DOM queries, and
                smart caching to avoid layout thrashing and unnecessary computations.
              </p>
              <ul className={styles.featureList}>
                <li>Position observer integration</li>
                <li>Minimal reflow impact</li>
                <li>TypeScript support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
