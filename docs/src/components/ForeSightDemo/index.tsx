import React, { useState, useEffect, useRef } from "react"
import styles from "./styles.module.css"
import { ForesightManager } from "js.foresight"

const ForeSightDemo = () => {
  const [debugMode, setDebugMode] = useState(true)
  const [selectedTab, setSelectedTab] = useState("overview")
  const hitSlop = 40

  useEffect(() => {
    ForesightManager.instance.alterGlobalSettings({
      debug: debugMode,
      defaultHitSlop: hitSlop,
    })
  }, [debugMode, hitSlop])

  const toggleDebugMode = () => {
    setDebugMode(!debugMode)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${selectedTab === "overview" ? styles.activeTab : ""}`}
            onClick={() => setSelectedTab("overview")}
          >
            Overview
          </button>
          <button
            className={`${styles.tabButton} ${
              selectedTab === "comparison" ? styles.activeTab : ""
            }`}
            onClick={() => setSelectedTab("comparison")}
          >
            Loading Comparison
          </button>
        </div>
      </div>

      {selectedTab === "overview" && (
        <Overview debugMode={debugMode} toggleDebugMode={toggleDebugMode} />
      )}

      {selectedTab === "comparison" && (
        <LoadingComparison
          hitSlop={hitSlop}
          debugMode={debugMode}
          toggleDebugMode={toggleDebugMode}
        />
      )}
    </div>
  )
}

const Overview = ({ debugMode, toggleDebugMode }) => {
  return (
    <div className={styles.overviewContainer}>
      <div className={styles.descriptionText}>
        <h2>What is ForeSightJs?</h2>
        <p>
          ForeSightJs is a JavaScript library that predicts user intent by analyzing mouse movements
          and trajectories. It allows web applications to anticipate user actions before they
          happen, creating a more responsive and fluid user experience.
        </p>
        <p>
          Key features include trajectory prediction, customizable hit slop areas, and the ability
          to prefetch data or resources before actual user interaction.
        </p>
      </div>

      <div className={styles.featureGrid}>
        <FeatureCard
          title="Trajectory Prediction"
          description="Predicts the path of your mouse based on its movement and velocity, allowing it to anticipate your intentions."
          icon="📈"
        />
        <FeatureCard
          title="Hit Slop Customization"
          description="Define custom hit areas around elements to trigger actions before the user actually hovers over the element itself."
          icon="🎯"
        />
        <FeatureCard
          title="Prefetch Optimization"
          description="Use predicted intent to prefetch data or resources before the user clicks, reducing perceived loading times."
          icon="⚡"
        />
        <FeatureCard
          title="Improved UX"
          description="Create a more responsive and fluid user experience by anticipating user actions and preparing for them in advance."
          icon="✨"
        />
      </div>

      <div className={styles.demoSection}>
        <div className={styles.demoHeader}>
          <h2>Try It Yourself</h2>
          <div className={styles.debugButtonContainer}>
            <button
              className={`${styles.debugButton} ${debugMode ? styles.active : ""}`}
              onClick={toggleDebugMode}
            >
              Debug Mode: {debugMode ? "ON" : "OFF"}
            </button>
          </div>
        </div>
        <p>Move your mouse toward any of these buttons to see ForeSightJs in action:</p>

        <div className={styles.buttonGrid}>
          <InteractiveDemo />
        </div>

        <p className={styles.demoHint}>
          Notice how the buttons light up <strong>before</strong> you actually hover over them. This
          is ForeSightJs predicting your intent based on your mouse movement.
        </p>
      </div>
    </div>
  )
}

const FeatureCard = ({ title, description, icon }) => (
  <div className={styles.featureCard}>
    <div className={styles.featureIcon}>{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
)

const InteractiveDemo = () => {
  const [activeButtons, setActiveButtons] = useState({})

  const handleActivation = (name) => {
    setActiveButtons((prev) => ({
      ...prev,
      [name]: true,
    }))

    setTimeout(() => {
      setActiveButtons((prev) => ({
        ...prev,
        [name]: false,
      }))
    }, 1000)
  }

  return (
    <>
      {[
        { name: "button-1", color: "#3498db", label: "Home" },
        { name: "button-2", color: "#e74c3c", label: "Products" },
        { name: "button-3", color: "#2ecc71", label: "About" },
        { name: "button-4", color: "#f39c12", label: "Contact" },
        { name: "button-5", color: "#9b59b6", label: "Blog" },
        { name: "button-6", color: "#1abc9c", label: "Settings" },
      ].map((button) => (
        <ForesightButton
          name={button.name}
          color={button.color}
          label={button.label}
          isActive={activeButtons[button.name] || false}
          onActivation={() => handleActivation(button.name)}
        />
      ))}
    </>
  )
}

const ForesightButton = ({ name, color, label, isActive, onActivation }) => {
  const buttonRef = useRef(null)

  useEffect(() => {
    if (buttonRef.current) {
      const unregister = ForesightManager.instance.register(
        buttonRef.current,
        onActivation,
        40,
        name,
        false
      )

      return () => unregister()
    }
  }, [buttonRef, name, onActivation])

  return (
    <button
      ref={buttonRef}
      className={`${styles.previewButton} ${isActive ? styles.activated : ""}`}
      style={{
        backgroundColor: color,
        boxShadow: isActive ? `0 0 20px ${color}` : "none",
      }}
    >
      {label}
    </button>
  )
}

// Loading comparison component
const LoadingComparison = ({ hitSlop, debugMode, toggleDebugMode }) => {
  const [resetTrigger, setResetTrigger] = useState(0)

  const handleResetAll = () => {
    setResetTrigger((prev) => prev + 1)
  }

  const resetButtonText = "Reset All Cards"

  return (
    <div className={styles.comparisonContainer}>
      <div className={styles.comparisonInfo}>
        <h2>Loading Strategy Comparison</h2>
        <p>
          This demo shows the difference between three loading strategies. All cards have a{" "}
          <strong>250ms fetch delay</strong> to simulate loading data from a server:
        </p>
        <ul className={styles.comparisonList}>
          <li>
            <strong>Regular:</strong> Loads data only when clicked (traditional approach)
          </li>
          <li>
            <strong>On Hover:</strong> Loads data when the mouse hovers over the card
          </li>
          <li>
            <strong>ForeSightJs:</strong> Loads data when the mouse trajectory predicts you'll
            interact with the card
          </li>
        </ul>
      </div>

      <div className={styles.controlsContainer}>
        <button className={styles.resetAllButton} onClick={handleResetAll}>
          {resetButtonText}
        </button>
        <div className={styles.debugButtonContainer}>
          <button
            className={`${styles.debugButton} ${debugMode ? styles.active : ""}`}
            onClick={toggleDebugMode}
          >
            Debug Mode: {debugMode ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div className={styles.cardGrid}>
        <RegularCard key={`regular-${resetTrigger}`} />
        <HoverCard key={`hover-${resetTrigger}`} />
        <ForesightCard hitSlop={hitSlop} />
      </div>

      <div className={styles.comparisonNote}>
        <p>
          <strong>Try it:</strong> Move your mouse toward the ForeSightJs card from different
          angles. Notice how it starts loading <strong>before</strong> you hover over it!
        </p>
      </div>
    </div>
  )
}

const RegularCard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadTime, setLoadTime] = useState(null)

  const handleClick = () => {
    if (!isLoading && !isLoaded) {
      setIsLoading(true)
      const startTime = performance.now()

      setTimeout(() => {
        const endTime = performance.now()
        setLoadTime(Math.round(endTime - startTime))
        setIsLoaded(true)
        setIsLoading(false)
      }, 250)
    }
  }

  const reset = () => {
    setIsLoaded(false)
    setLoadTime(null)
  }

  return (
    <div className={styles.loadingCard}>
      <div className={styles.cardHeader} style={{ backgroundColor: "#333" }}>
        <h3>Regular</h3>
        <p>Loads only when clicked</p>
      </div>

      <div className={styles.cardContent} onClick={!isLoading && !isLoaded ? handleClick : null}>
        {isLoading ? (
          <div className={styles.cardState}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.statusText}>Loading...</p>
          </div>
        ) : isLoaded ? (
          <div className={styles.cardState}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.statusText}>PREFETCHED!</p>
          </div>
        ) : (
          <div className={styles.cardState}>
            <div className={styles.notLoadedIcon}>✗</div>
            <p className={styles.statusText}>NOT LOADED</p>
            <p>Click to load data</p>
          </div>
        )}
      </div>
    </div>
  )
}

const HoverCard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadTime, setLoadTime] = useState(null)
  const cardRef = useRef(null)

  const handleHover = () => {
    if (!isLoading && !isLoaded) {
      setIsLoading(true)
      const startTime = performance.now()

      setTimeout(() => {
        const endTime = performance.now()
        setLoadTime(Math.round(endTime - startTime))
        setIsLoaded(true)
        setIsLoading(false)
      }, 250)
    }
  }

  const reset = () => {
    setIsLoaded(false)
    setLoadTime(null)
  }

  return (
    <div
      ref={cardRef}
      className={styles.loadingCard}
      onMouseEnter={!isLoading && !isLoaded ? handleHover : null}
    >
      <div className={styles.cardHeader} style={{ backgroundColor: "#9b59b6" }}>
        <h3>On Hover</h3>
        <p>Loads when hovered</p>
      </div>

      <div className={styles.cardContent}>
        {isLoading ? (
          <div className={styles.cardState}>
            <div className={styles.loadingSpinner} style={{ borderTopColor: "#9b59b6" }}></div>
            <p className={styles.statusText}>Loading...</p>
          </div>
        ) : isLoaded ? (
          <div className={styles.cardState}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.statusText}>PREFETCHED!</p>
          </div>
        ) : (
          <div className={styles.cardState}>
            <div className={styles.notLoadedIcon}>✗</div>
            <p className={styles.statusText}>NOT LOADED</p>
            <p>Hover to load data</p>
          </div>
        )}
      </div>
    </div>
  )
}

const ForesightCard = ({ hitSlop }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadTime, setLoadTime] = useState(null)
  const cardRef = useRef(null)

  useEffect(() => {
    if (cardRef.current) {
      const unregister = ForesightManager.instance.register(
        cardRef.current,
        () => {
          if (!isLoading && !isLoaded) {
            setIsLoading(true)
            const startTime = performance.now()

            setTimeout(() => {
              const endTime = performance.now()
              setLoadTime(Math.round(endTime - startTime))
              setIsLoaded(true)
              setIsLoading(false)
            }, 250)
          }
        },
        hitSlop,
        "foresight-card",
        false
      )

      return () => unregister()
    }
  }, [cardRef, hitSlop, isLoading, isLoaded])

  const reset = () => {
    setIsLoaded(false)
    setLoadTime(null)
  }

  return (
    <div ref={cardRef} className={styles.loadingCard}>
      <div className={styles.cardHeader} style={{ backgroundColor: "#3498db" }}>
        <h3>ForeSightJs</h3>
        <p>Loads on predicted intent</p>
      </div>

      <div className={styles.cardContent}>
        {isLoading ? (
          <div className={styles.cardState}>
            <div className={styles.loadingSpinner} style={{ borderTopColor: "#3498db" }}></div>
            <p className={styles.statusText}>Loading...</p>
          </div>
        ) : isLoaded ? (
          <div className={styles.cardState}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.statusText}>PREFETCHED!</p>
          </div>
        ) : (
          <div className={styles.cardState}>
            <div className={styles.notLoadedIcon}>✗</div>
            <p className={styles.statusText}>NOT LOADED</p>
            <p>Move your mouse toward this card</p>
            <p className={styles.smallText}>It will predict your intent!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForeSightDemo
