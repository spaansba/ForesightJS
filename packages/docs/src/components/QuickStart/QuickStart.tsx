import { useState } from "react"
import Link from "@docusaurus/Link"
import { Highlight, themes } from "prism-react-renderer"
import styles from "./quickstart.module.css"

type Tab = {
  id: string
  label: string
  language: string
  code: string
  docsLink: string
  docsLabel: string
  disclaimer?: string
}

const TABS: Tab[] = [
  {
    id: "js",
    label: "JavaScript",
    language: "javascript",
    docsLink: "/docs/getting-started/quick-start",
    docsLabel: "JavaScript docs",
    code: `import { ForesightManager } from 'js.foresight'

// Initialize the manager if you want custom settings (optional)
ForesightManager.initialize({
  touchDeviceStrategy: "viewport",
  tabOffset: 5,
})

// Register an element for prediction
const myLink = document.querySelector('#my-link')

ForesightManager.instance.register({
  element: myLink,
  callback: () => {
    console.log('User intent detected!')
  },
})`,
  },
  {
    id: "react",
    label: "React",
    language: "tsx",
    docsLink: "/docs/react/installation",
    docsLabel: "React docs",
    disclaimer:
      "@foresightjs/react is published as 0.1.0 - it works and is tested, but the API may still change.",
    code: `import { useForesight } from '@foresightjs/react'

function PrefetchLink() {
  const { elementRef } = useForesight<HTMLAnchorElement>({
    callback: () => {
      console.log('User intent detected!')
    },
  })

  return <a ref={elementRef} href="/about">About</a>
}`,
  },
  {
    id: "vue",
    label: "Vue",
    language: "markup",
    docsLink: "/docs/vue/installation",
    docsLabel: "Vue docs",
    disclaimer:
      "@foresightjs/vue is published as 0.1.0 - it works and is tested, but the API may still change.",
    code: `<script setup lang="ts">
import { useForesight } from '@foresightjs/vue'

const { elementRef } = useForesight({
  callback: () => {
    console.log('User intent detected!')
  },
})
</script>

<template>
  <a :ref="elementRef" href="/about">About</a>
</template>`,
  },
]

export const QuickStart = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].id)
  const tab = TABS.find(t => t.id === activeTab) ?? TABS[0]

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
              {TABS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.tab} ${t.id === activeTab ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Highlight theme={themes.vsDark} code={tab.code} language={tab.language}>
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
            <div className={styles.codeFooter}>
              {tab.disclaimer && <span className={styles.disclaimer}>{tab.disclaimer}</span>}
              <Link to={tab.docsLink} className={styles.docsLink}>
                {tab.docsLabel} →
              </Link>
            </div>
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
                className="site-btn site-btn--primary"
              >
                Full Documentation
              </Link>
              <Link
                to="/docs/configuration/global-settings"
                className="site-btn site-btn--secondary"
              >
                Configuration
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
