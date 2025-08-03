import Link from "@docusaurus/Link"
import { Highlight, themes } from "prism-react-renderer"
import styles from "./quickstart.module.css"

export function QuickStart() {
  return (
    <section className={styles.quickStartSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Quick Start</h2>
          <p className={styles.sectionSubtitle}>
            Start predicting user intent in under 5 minutes. Zero complex setup.
          </p>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.codeExample}>
            <div className={styles.codeHeader}>
              <span>Basic Usage</span>
            </div>
            <Highlight
              theme={themes.vsDark}
              code={`import { ForesightManager } from 'js.foresight'

// Initialize the manager if you want custom settings
// Otherwise you can skip this step of initialization
ForesightManager.initialize({
  touchDeviceStrategy: "viewport",
  tabOffset: 5
})

// Register an element for prediction
const myLink = document.querySelector('#my-link')

// Register a callback to be called when the user shows intent
ForesightManager.instance.register({
  element: myLink,
  callback: () => {
    console.log('User intent detected!')
  }
  // Optional: extra settings
})`}
              language="javascript"
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre className={`${styles.codeBlock} ${className}`} style={style}>
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </div>

          <div className={styles.features}>
            <h3>What you get:</h3>
            <ul className={styles.featureList}>
              <li>
                <strong>Mouse prediction:</strong> Detect cursor trajectory towards elements
              </li>
              <li>
                <strong>Keyboard support:</strong> Detect user tabbing towards elements
              </li>
              <li>
                <strong>Scroll Prediction:</strong> Detect scrolling towards a fetchable element
              </li>
              <li>
                <strong>Touch device support:</strong> Full touch device support (mobile/pen)
              </li>
              <li>
                <strong>Performance:</strong> No polling, no reflows, event-driven architecture
              </li>
              <li>
                <strong>TypeScript:</strong> Full type safety out of the box
              </li>
            </ul>

            <div className={styles.actions}>
              <Link
                to="/docs/getting-started/what-is-foresightjs"
                className="button button--primary"
              >
                Full Documentation
              </Link>
              <Link to="/docs/configuration/global-settings" className="button button--secondary">
                Configuration
              </Link>
            </div>

            <div className={styles.integrations}>
              <h4>Premade Framework Integrations:</h4>
              <div className={styles.integrationLinks}>
                <Link to="/docs/integrations/react/nextjs" className={styles.integrationLink}>
                  Next.js
                </Link>
                <Link to="/docs/integrations/react/react-router" className={styles.integrationLink}>
                  React Router
                </Link>
                {/* <Link to="/docs/integrations/vue/vue" className={styles.integrationLink}>
                  Vue.js
                </Link>
                <Link to="/docs/integrations/tanstack" className={styles.integrationLink}>
                  TanStack Router
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
