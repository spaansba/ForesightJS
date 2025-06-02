import { FeatureCard } from "./FeatureCard"
import styles from "../styles.module.css"
export const Overview = () => {
  return (
    <div className={styles.overviewContainer}>
      <div className={styles.descriptionText}>
        <h2>What is ForesightJs?</h2>
        <p>
          ForesightJS is a free and open-source JavaScript library that helps predict what users are
          likely to do next by analyzing their mouse movements and keyboard navigation. It lets
          developers prefetch data ahead of time based on these predictions, instead of waiting for
          actions like clicks or hovers. This makes websites feel faster and more responsive for
          both mouse and keyboard users, and is less wasteful than prefetching content as soon as it
          enters the viewport.
        </p>
      </div>

      <div className={styles.cardGrid}>
        <FeatureCard
          title="Cursor Prediction"
          description="Prefetch data based on where the users cursor is heading, not where it is currently hovering"
          icon="🖱"
        />
        <FeatureCard
          title="Keyboard Prediction"
          description="Prefetch data when the user is N tab stops away from your element. Also works for shift-tabbing."
          icon="⌨"
        />
        <FeatureCard
          title="Fully Customizable"
          description="Configure how aggressively predictions are made, adjust hit areas around elements and much more."
          icon="⚙️"
        />
        <FeatureCard
          title="Debug Mode"
          description="Built-in visual debugging with trajectory visualization, hit area overlays, and interactive control panel for tuning 
          configurations in real-time."
          icon="🐛"
        />
      </div>
    </div>
  )
}
