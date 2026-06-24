import { useState } from "react"
import Link from "@docusaurus/Link"
import { Highlight, themes } from "prism-react-renderer"
import styles from "./quickstart.module.css"

type Variant = {
  id: string
  label: string
  language: string
  code: string
}

type Tab = {
  id: string
  label: string
  docsLink: string
  docsLabel: string
  disclaimer?: string
  variants: Variant[]
}

const TABS: Tab[] = [
  {
    id: "js",
    label: "JavaScript",
    docsLink: "/docs/getting-started/quick-start",
    docsLabel: "JavaScript docs",
    variants: [
      {
        id: "register",
        label: "Register",
        language: "javascript",
        code: `import { ForesightManager } from 'js.foresight'

const myButton = document.querySelector('#my-button')

ForesightManager.instance.register({
  element: myButton,
  callback: () => console.log("prefetch logic here"),
})`,
      },
    ],
  },
  {
    id: "react",
    label: "React",
    docsLink: "/docs/react/installation",
    docsLabel: "React docs",
    disclaimer:
      "@foresightjs/react is in beta. It works and is tested, but the API may still change.",
    variants: [
      {
        id: "component",
        label: "Foresight component",
        language: "tsx",
        code: `import { Foresight } from '@foresightjs/react'

function PrefetchButton() {
  return (
    <Foresight as="button" callback={() => console.log("prefetch logic here")}>
      Prefetch
    </Foresight>
  )
}`,
      },
      {
        id: "hook",
        label: "useForesight hook",
        language: "tsx",
        code: `import { useForesight } from '@foresightjs/react'

function PrefetchButton() {
  const { elementRef } = useForesight<HTMLButtonElement>({
    callback: () => console.log("prefetch logic here"),
  })

  return <button ref={elementRef}>Prefetch</button>
}`,
      },
    ],
  },
  {
    id: "vue",
    label: "Vue",
    docsLink: "/docs/vue/installation",
    docsLabel: "Vue docs",
    disclaimer:
      "@foresightjs/vue is in beta. It works and is tested, but the API may still change.",
    variants: [
      {
        id: "component",
        label: "Foresight component",
        language: "markup",
        code: `<script setup lang="ts">
import { Foresight } from '@foresightjs/vue'
</script>

<template>
  <Foresight as="button" :callback="() => console.log('prefetch logic here')">
    Prefetch
  </Foresight>
</template>`,
      },
      {
        id: "directive",
        label: "v-foresight directive",
        language: "markup",
        code: `<script setup lang="ts">
import { vForesight } from '@foresightjs/vue'
</script>

<template>
  <button v-foresight="() => console.log('prefetch logic here')">Prefetch</button>
</template>`,
      },
      {
        id: "composable",
        label: "useForesight composable",
        language: "markup",
        code: `<script setup lang="ts">
import { useForesight } from '@foresightjs/vue'

const { elementRef } = useForesight({
  callback: () => console.log("prefetch logic here"),
})
</script>

<template>
  <button :ref="elementRef">Prefetch</button>
</template>`,
      },
    ],
  },
]

export const QuickStart = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].id)
  const tab = TABS.find(t => t.id === activeTab) ?? TABS[0]
  const [activeVariant, setActiveVariant] = useState(tab.variants[0].id)
  const variant = tab.variants.find(v => v.id === activeVariant) ?? tab.variants[0]

  const selectTab = (nextTab: Tab) => {
    setActiveTab(nextTab.id)
    setActiveVariant(nextTab.variants[0].id)
  }

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
                  onClick={() => selectTab(t)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tab.variants.length > 1 && (
              <div className={styles.codeHeader}>
                {tab.variants.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    className={`${styles.tab} ${v.id === activeVariant ? styles.tabActive : ""}`}
                    onClick={() => setActiveVariant(v.id)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}
            <Highlight theme={themes.vsDark} code={variant.code} language={variant.language}>
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
