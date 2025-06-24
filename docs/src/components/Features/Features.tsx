import styles from "./features.module.css"

export function Features() {
  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Prefetch Smarter</h2>
        </div>

        <div className={styles.featuresContent}>
          <div className={styles.featureRow}>
            <div className={styles.featureNumber}>01</div>
            <div className={styles.featureInfo}>
              <h3>Mouse Trajectory Prediction</h3>
              <p>
                Make your app feel instantaneous. By analyzing mouse movements, we prefetch pages
                and data the moment a user heads towards a link, making navigation feel incredibly
                fast.
              </p>
            </div>
          </div>

          <div className={styles.featureRow}>
            <div className={styles.featureNumber}>02</div>
            <div className={styles.featureInfo}>
              <h3>Keyboard Navigation</h3>
              <p>
                Prefetch content as users tab through links, making sure keyboard users have the
                same blazingly fast experience as mouse users.
              </p>
            </div>
          </div>

          <div className={styles.featureRow}>
            <div className={styles.featureNumber}>03</div>
            <div className={styles.featureInfo}>
              <h3>Scroll-Based Prediction</h3>
              <p>
                Prefetches content around the mouse in the direction the user is scrolling. For
                those links that just pop into the viewport!
              </p>
            </div>
          </div>

          <div className={styles.featureRow}>
            <div className={styles.featureNumber}>04</div>
            <div className={styles.featureInfo}>
              <h3>Optimized for Performance</h3>
              <p>
                Built with performance in mind using observers, minimal DOM queries, and caching to
                avoid layout thrashing and unnecessary computations. Read about the magic in our{" "}
                <a className={styles.inlineLink} href="/docs/Behind_the_Scenes" target="_blank">
                  behind the scenes
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
