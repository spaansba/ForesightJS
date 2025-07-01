import styles from "../styles.module.css"
type FeatureCardProps = {
  title: string
  description: string
  icon: string
}
export const FeatureCard = ({ title, description, icon }: FeatureCardProps) => (
  <div className={styles.featureCard}>
    <div className={styles.featureIcon}>{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
)
