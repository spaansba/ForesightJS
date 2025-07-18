import styles from "../../styles.module.css"
import keyboardStyles from "../Keyboard/styles.module.css"
import { ForesightCard } from "../Mouse/ForesightCard"
import { HoverCard } from "../Mouse/HoverCard"
import { RegularCard } from "../Mouse/RegularCard"

import ResetCardsButton from "../Mouse/ResetCardsButton"
import DebugButton from "../../DebugButton"
import { useState } from "react"
import PictureButton from "./PictureButton"

export type ForesightImage = {
  id: string
  name: string
  url: string
}

const IMAGES: ForesightImage[] = [
  {
    id: "mountains",
    name: "Mountains",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "ocean",
    name: "Ocean",
    url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "forest",
    name: "Forest",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "city",
    name: "City",
    url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2070&auto=format&fit=crop",
  },
]

function Playground() {
  const [resetTrigger, setResetTrigger] = useState(0)
  const handleResetAll = () => {
    setResetTrigger(prev => prev + 1)
  }

  return (
    <>
      {/* Mouse Cards Comparison */}
      <div className={styles.demoCardGrid}>
        <div className={styles.demoTraditionalWrapper}>
          <div className={styles.sectionHeader}>
            <h3>Traditional Prefetching</h3>
          </div>
          <div className={styles.demoCards}>
            <HoverCard key={`HoverCard-${resetTrigger}`} />
            <RegularCard key={`RegularCard-${resetTrigger}`} />
          </div>
        </div>
        <div className={styles.demoForesightWrapper}>
          <div className={styles.sectionHeader}>
            <h3>ForesightJS Prefetching</h3>
          </div>
          <div className={styles.demoCards}>
            <ForesightCard key={`ForesightCard-${resetTrigger}`} />
          </div>
        </div>
      </div>

      <div className={styles.sectionDivider}>
        <>
          <ResetCardsButton onReset={handleResetAll} />
          <DebugButton />
        </>
      </div>

      {/* Keyboard Navigation Section */}
      <div key={`playground-${resetTrigger}`} className={styles.keyboardSection}>
        <div className={keyboardStyles.buttonGrid}>
          {IMAGES.map(image => (
            // <SmallButton key={id} index={index} />
            <PictureButton image={image} key={image.id} />
          ))}
        </div>
        <div className={styles.keyboardTip}>
          <strong>TIP:</strong> Try using <kbd>Tab</kbd> and <kbd>Shift+Tab</kbd> to navigate
          through the buttons above
        </div>
        <div className={styles.keyboardTip}>
          <strong>TIP:</strong> Install{" "}
          <a href="/docs/getting_started/development_tools" style={{ color: "#7dd3fc" }}>
            Development Tools
          </a>{" "}
          for visual feedback and real-time tuning
        </div>
      </div>
    </>
  )
}

export default Playground
