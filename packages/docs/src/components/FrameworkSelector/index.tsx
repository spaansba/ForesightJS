import React, { useEffect, useRef, useState } from "react"
import { useHistory, useLocation } from "@docusaurus/router"
import styles from "./styles.module.css"

type FrameworkId = "js" | "react" | "vue" | "angular" | "astro"

const ROOTS: Record<FrameworkId, string> = {
  js: "/docs/getting-started/what-is-foresightjs",
  react: "/docs/react/what-is-foresightjs",
  vue: "/docs/vue/what-is-foresightjs",
  angular: "/docs/angular/what-is-foresightjs",
  astro: "/docs/astro/what-is-foresightjs",
}

// Pages that exist in every framework tree. When switching frameworks from one
// of these, the selector navigates to the equivalent page instead of the root.
// A framework missing from a row (e.g. astro has no migration page) falls back
// to its root.
const EQUIVALENTS: Array<Partial<Record<FrameworkId, string>>> = [
  {
    js: "/docs/getting-started/what-is-foresightjs",
    react: "/docs/react/what-is-foresightjs",
    vue: "/docs/vue/what-is-foresightjs",
    angular: "/docs/angular/what-is-foresightjs",
    astro: "/docs/astro/what-is-foresightjs",
  },
  {
    js: "/docs/getting-started/initialize-the-manager",
    react: "/docs/react/initialize-the-manager",
    vue: "/docs/vue/initialize-the-manager",
    angular: "/docs/angular/initialize-the-manager",
    astro: "/docs/astro/initialize-the-manager",
  },
  {
    js: "/docs/getting-started/quick-start",
    react: "/docs/react/quick-start",
    vue: "/docs/vue/quick-start",
    angular: "/docs/angular/quick-start",
    astro: "/docs/astro/quick-start",
  },
  {
    js: "/docs/getting-started/typescript",
    react: "/docs/react/typescript",
    vue: "/docs/vue/typescript",
    angular: "/docs/angular/typescript",
    astro: "/docs/astro/typescript",
  },
  {
    js: "/docs/configuration/global-settings",
    react: "/docs/react/configuration/global-settings",
    vue: "/docs/vue/configuration/global-settings",
    angular: "/docs/angular/configuration/global-settings",
    astro: "/docs/astro/configuration/global-settings",
  },
  {
    js: "/docs/configuration/registration-options",
    react: "/docs/react/configuration/registration-options",
    vue: "/docs/vue/configuration/registration-options",
    angular: "/docs/angular/configuration/registration-options",
    astro: "/docs/astro/configuration/registration-options",
  },
  {
    js: "/docs/events",
    react: "/docs/react/events",
    vue: "/docs/vue/events",
    angular: "/docs/angular/events",
    astro: "/docs/astro/events",
  },
  {
    js: "/docs/debugging/devtools",
    react: "/docs/react/devtools",
    vue: "/docs/vue/devtools",
    angular: "/docs/angular/devtools",
    astro: "/docs/astro/devtools",
  },
  {
    js: "/docs/debugging/static-properties",
    react: "/docs/react/static-properties",
    vue: "/docs/vue/static-properties",
    angular: "/docs/angular/static-properties",
    astro: "/docs/astro/static-properties",
  },
  {
    js: "/docs/migrating-to-v4",
    react: "/docs/react/migrating-to-v4",
    vue: "/docs/vue/migrating-to-v4",
    angular: "/docs/angular/migrating-to-v4",
  },
  {
    js: "/docs/Behind_the_Scenes",
    react: "/docs/react/behind-the-scenes",
    vue: "/docs/vue/behind-the-scenes",
    angular: "/docs/angular/behind-the-scenes",
    astro: "/docs/astro/behind-the-scenes",
  },
  {
    js: "/docs/ai-context",
    react: "/docs/react/ai-context",
    vue: "/docs/vue/ai-context",
    angular: "/docs/angular/ai-context",
    astro: "/docs/astro/ai-context",
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

const AngularIcon = () => {
  return (
    <svg className={styles.icon} viewBox="0 0 32 32" aria-hidden="true">
      <path fill="#dd0031" d="M16 2 3 6.6l2 17.1L16 30l11-6.3 2-17.1L16 2Z" />
      <path fill="#c3002f" d="M16 2v28l11-6.3 2-17.1L16 2Z" />
      <path fill="#fff" d="M16 6.1 7.9 24.2h3l1.6-4h7l1.6 4h3L16 6.1Zm2.5 11.7h-5l2.5-6 2.5 6Z" />
    </svg>
  )
}

const AstroIcon = () => {
  return (
    <svg className={styles.icon} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="5" fill="#17191e" />
      <g transform="translate(4 4)">
        <path
          fill="#ff5d01"
          d="M16.074 16.86c-.72.616-2.157 1.035-3.812 1.035-2.032 0-3.735-.632-4.187-1.483-.161.488-.198 1.046-.198 1.402 0 0-.106 1.75 1.111 2.968 0-.632.512-1.145 1.144-1.145 1.083 0 1.081.945 1.08 1.712v.069c0 1.163.711 2.161 1.723 2.582a2.32 2.32 0 0 1-.236-1.029c0-1.11.652-1.523 1.41-2.003.602-.383 1.272-.807 1.733-1.66a3.129 3.129 0 0 0 .378-1.494 3.14 3.14 0 0 0-.146-.954z"
        />
        <path
          fill="#fff"
          d="M15.551.6c.196.244.296.572.496 1.229l4.368 14.347a11.633 11.633 0 0 0-3.339-1.131L14.232 5.44a.37.37 0 0 0-.71.002l-2.81 9.6a11.62 11.62 0 0 0-3.354 1.133L11.747 1.82c.2-.653.3-.98.496-1.222a1.606 1.606 0 0 1 .65-.482c.291-.116.633-.116 1.318-.116h.538c.686 0 1.028 0 1.32.117.264.106.487.272.65.483z"
        />
      </g>
    </svg>
  )
}

const FRAMEWORKS: Array<{ id: FrameworkId; label: string; Icon: () => React.ReactNode }> = [
  { id: "js", label: "JavaScript", Icon: JsIcon },
  { id: "react", label: "React", Icon: ReactIcon },
  { id: "vue", label: "Vue", Icon: VueIcon },
  { id: "angular", label: "Angular", Icon: AngularIcon },
  { id: "astro", label: "Astro", Icon: AstroIcon },
]

const detectFramework = (pathname: string): FrameworkId => {
  if (pathname.startsWith("/docs/react/")) {
    return "react"
  }

  if (pathname.startsWith("/docs/vue/")) {
    return "vue"
  }

  if (pathname.startsWith("/docs/angular/")) {
    return "angular"
  }

  if (pathname.startsWith("/docs/astro/")) {
    return "astro"
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
    history.push(equivalent?.[next] ?? ROOTS[next])
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
