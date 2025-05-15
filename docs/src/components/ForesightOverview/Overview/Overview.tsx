import DemoWrapper from "./DemoWrapper"
import { FeatureCard } from "./FeatureCard"
import styles from "../styles.module.css"
export const Overview = () => {
  return (
    <div className={styles.overviewContainer}>
      <div className={styles.descriptionText}>
        <h2>What is ForesightJs?</h2>
        <p>
          ForesightJS is a free and open-source JavaScript library that predicts user intent by
          analyzing mouse movements and trajectories. It allows developers to prefetch data based on
          user intent instead of the classic on-click or on-hover.
        </p>
      </div>

      <div className={styles.cardGrid}>
        <FeatureCard
          title="Trajectory Prediction"
          description="Predict based on movement and volicity where the user's cursor is heading, allowing for early prefetching."
          icon="📈"
        />
        <FeatureCard
          title="Element Hit Slop"
          description="Add custom hit areas around elements to trigger actions before the user actually hovers over the element itself."
          icon="🎯"
        />
        <FeatureCard
          title="Efficient Prefetching"
          description="Save bandwidth by only prefetching what users will actually need, instead of prefetching everything in the viewport like traditional approaches."
          icon="🔋"
        />
      </div>
    </div>
  )
}
