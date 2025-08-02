import styles from "./features.module.css"

export function Features() {
  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Prefetch Smarter</h2>
          <p className={styles.sectionSubtitle}>
            ForesightJS predicts user intent to prefetch content before it's needed. It's fully
            configurable and traceable, using different strategies for desktop and mobile users.
          </p>
        </div>

        <div className={styles.featuresContent}>
          <div className={styles.deviceColumn}>
            <div className={styles.deviceHeader}>
              <h3>Keyboard/Mouse Users</h3>
              <p className={styles.deviceSubtitle}>
                Pick and choose multiple prediction strategies
              </p>
            </div>
            <div className={styles.techniqueGroup}>
              <h4>Mouse Trajectory</h4>
              <p className={styles.techniqueDescription}>
                Analyzes cursor movement patterns to predict which links users are heading towards
                and prefetches content before they arrive
              </p>
            </div>
            <div className={styles.techniqueGroup}>
              <h4>Keyboard Navigation</h4>
              <p className={styles.techniqueDescription}>
                Tracks tab key usage to prefetch when the user is N tab stops away from your
                registered element
              </p>
            </div>
            <div className={styles.techniqueGroup}>
              <h4>Scroll</h4>
              <p className={styles.techniqueDescription}>
                Prefetches content when users scroll towards registered elements, predicting which
                elements will be reached based on scroll direction
              </p>
            </div>
          </div>

          <div className={styles.deviceColumn}>
            <div className={styles.deviceHeader}>
              <h3>Touch Devices</h3>
              <p className={styles.deviceSubtitle}>Choose either Viewport Enter OR onTouchStart</p>
            </div>
            <div className={styles.techniqueGroup}>
              <h4>Viewport Enter</h4>
              <p className={styles.techniqueDescription}>
                Detects when registered elements enter the viewport and prefetches their content
                based on scroll behavior and visibility
              </p>
            </div>
            <div className={styles.techniqueGroup}>
              <h4>onTouchStart</h4>
              <p className={styles.techniqueDescription}>
                Captures the initial touch event to begin prefetching when users start interacting
                with registered elements
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
