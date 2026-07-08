import { Monitor, Smartphone } from "lucide-react"
import styles from "./features.module.css"

const devices = [
  {
    title: "Keyboard & Mouse",
    icon: Monitor,
    techniques: [
      {
        name: "Mouse Trajectory",
        description:
          "Analyzes cursor movement to predict which links a user is heading towards, prefetching before they arrive.",
      },
      {
        name: "Keyboard Navigation",
        description:
          "Tracks tab key usage to prefetch once the user is N tab stops away from your registered element.",
      },
      {
        name: "Scroll",
        description:
          "Predicts which elements will be reached from scroll direction and prefetches them on the way.",
      },
    ],
  },
  {
    title: "Touch Devices",
    icon: Smartphone,
    techniques: [
      {
        name: "Viewport Enter",
        description:
          "Detects when registered elements enter the viewport and prefetches based on scroll and visibility.",
      },
      {
        name: "onTouchStart",
        description:
          "Captures the initial touch to begin prefetching the moment a user starts interacting.",
      },
    ],
  },
]

export const Features = () => {
  return (
    <section className={styles.featuresSection}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {devices.map(device => (
            <div key={device.title} className={styles.column}>
              <div className={styles.columnHeader}>
                <device.icon size={18} strokeWidth={1.75} className={styles.deviceIcon} />
                <h3 className={styles.deviceTitle}>{device.title}</h3>
              </div>
              <ul className={styles.techniqueList}>
                {device.techniques.map(technique => (
                  <li key={technique.name} className={styles.technique}>
                    <h4 className={styles.techniqueName}>{technique.name}</h4>
                    <p className={styles.techniqueDescription}>{technique.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
