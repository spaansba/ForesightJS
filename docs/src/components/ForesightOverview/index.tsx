import DemoWrapper from "./Overview/DemoWrapper"
import { Overview } from "./Overview/Overview"
import styles from "./styles.module.css"

export const ForesightDemo = () => {
  return (
    <div className={styles.container}>
      <Overview />
      <DemoWrapper />
    </div>
  )
}
