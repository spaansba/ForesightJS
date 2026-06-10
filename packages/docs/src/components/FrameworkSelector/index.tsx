import React, { useEffect, useRef, useState } from "react"
import { useHistory, useLocation } from "@docusaurus/router"
import styles from "./styles.module.css"

type FrameworkId = "js" | "react" | "vue"

const ROOTS: Record<FrameworkId, string> = {
  js: "/docs/getting-started/what-is-foresightjs",
  react: "/docs/react/what-is-foresightjs",
  vue: "/docs/vue/what-is-foresightjs",
}

// Pages that exist in every framework tree. When switching frameworks from one
// of these, the selector navigates to the equivalent page instead of the root.
const EQUIVALENTS: Array<Record<FrameworkId, string>> = [
  {
    js: "/docs/getting-started/what-is-foresightjs",
    react: "/docs/react/what-is-foresightjs",
    vue: "/docs/vue/what-is-foresightjs",
  },
  {
    js: "/docs/getting-started/initialize-the-manager",
    react: "/docs/react/initialize-the-manager",
    vue: "/docs/vue/initialize-the-manager",
  },
  {
    js: "/docs/getting-started/quick-start",
    react: "/docs/react/quick-start",
    vue: "/docs/vue/quick-start",
  },
  {
    js: "/docs/getting-started/typescript",
    react: "/docs/react/typescript",
    vue: "/docs/vue/typescript",
  },
  {
    js: "/docs/configuration/global-settings",
    react: "/docs/react/configuration/global-settings",
    vue: "/docs/vue/configuration/global-settings",
  },
  {
    js: "/docs/configuration/registration-options",
    react: "/docs/react/configuration/registration-options",
    vue: "/docs/vue/configuration/registration-options",
  },
  {
    js: "/docs/events",
    react: "/docs/react/events",
    vue: "/docs/vue/events",
  },
  {
    js: "/docs/debugging/devtools",
    react: "/docs/react/devtools",
    vue: "/docs/vue/devtools",
  },
  {
    js: "/docs/debugging/static-properties",
    react: "/docs/react/static-properties",
    vue: "/docs/vue/static-properties",
  },
  {
    js: "/docs/migrating-to-v4",
    react: "/docs/react/migrating-to-v4",
    vue: "/docs/vue/migrating-to-v4",
  },
  {
    js: "/docs/Behind_the_Scenes",
    react: "/docs/react/behind-the-scenes",
    vue: "/docs/vue/behind-the-scenes",
  },
  {
    js: "/docs/ai-context",
    react: "/docs/react/ai-context",
    vue: "/docs/vue/ai-context",
  },
]

const JsIcon = () => {
  return (
    <svg className={styles.icon} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="5" fill="#f7df1e" />
      <text
        x="16"
        y="23"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fontFamily="sans-serif"
        fill="#000"
      >
        JS
      </text>
    </svg>
  )
}

const ReactIcon = () => {
  return (
    <svg className={styles.icon} viewBox="-11.5 -10.23174 23 20.46348" aria-hidden="true">
      <circle r="2.05" fill="#61dafb" />
      <g stroke="#61dafb" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  )
}

const VueIcon = () => {
  return (
    <svg className={styles.icon} viewBox="0 0 256 221" aria-hidden="true">
      <path fill="#41b883" d="M204.8 0H256L128 220.8 0 0h97.92L128 51.2 157.44 0Z" />
      <path fill="#35495e" d="M50.56 0 128 133.12 204.8 0h-47.36L128 51.2 97.92 0Z" />
    </svg>
  )
}

const FRAMEWORKS: Array<{ id: FrameworkId; label: string; Icon: () => React.ReactNode }> = [
  { id: "js", label: "JavaScript", Icon: JsIcon },
  { id: "react", label: "React", Icon: ReactIcon },
  { id: "vue", label: "Vue", Icon: VueIcon },
]

const detectFramework = (pathname: string): FrameworkId => {
  if (pathname.startsWith("/docs/react/")) {
    return "react"
  }

  if (pathname.startsWith("/docs/vue/")) {
    return "vue"
  }

  return "js"
}

export default function FrameworkSelector(): React.ReactNode {
  const { pathname } = useLocation()
  const history = useHistory()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  // Only the current version has per-framework trees
  if (/^\/docs\/\d/.test(pathname)) {
    return null
  }

  const current = FRAMEWORKS.find(f => f.id === detectFramework(pathname))!

  const switchFramework = (next: FrameworkId) => {
    setOpen(false)

    if (next === current.id) {
      return
    }

    const path = pathname.replace(/\/$/, "")
    const equivalent = EQUIVALENTS.find(row => row[current.id] === path)
    history.push(equivalent ? equivalent[next] : ROOTS[next])
  }

  return (
    <div className={styles.wrapper} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Framework: ${current.label}`}
        onClick={() => setOpen(o => !o)}
      >
        <current.Icon />
        <span className={styles.triggerLabel}>{current.label}</span>
        <span className={styles.caret} aria-hidden="true" />
      </button>
      {open && (
        <ul className={styles.menu} role="listbox" aria-label="Framework">
          {FRAMEWORKS.map(({ id, label, Icon }) => (
            <li key={id} role="option" aria-selected={id === current.id}>
              <button
                type="button"
                className={`${styles.item} ${id === current.id ? styles.itemActive : ""}`}
                onClick={() => switchFramework(id)}
              >
                <Icon />
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
