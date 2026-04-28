import { useRef, useState } from "react"
import { Route, Routes, useLocation } from "react-router-dom"
import { SimpleNavigation } from "../../components/SimpleNavigation"
import { ForesightLink } from "./ForesightLink"

type PrefetchEntry = {
  to: string
  at: number
}

type DemoPageProps = {
  title: string
  body: string
}

const DemoPage = ({ title, body }: DemoPageProps) => (
  <section className="border border-gray-300 bg-white p-6 space-y-3">
    <h2 className="text-base font-semibold">{title}</h2>
    <p className="text-sm text-gray-700 leading-relaxed">{body}</p>
  </section>
)

const ROUTES = [
  { to: "about", name: "rr-about", label: "About" },
  { to: "contact", name: "rr-contact", label: "Contact" },
  { to: "pricing", name: "rr-pricing", label: "Pricing" },
] as const

const ReactRouterDemo = () => {
  const [prefetches, setPrefetches] = useState<PrefetchEntry[]>([])
  const cacheRef = useRef<Set<string>>(new Set())
  const location = useLocation()

  const handlePrefetch = (to: string) => {
    if (cacheRef.current.has(to)) {
      return
    }

    cacheRef.current.add(to)
    setPrefetches(prev => [{ to, at: Date.now() }, ...prev].slice(0, 10))
  }

  return (
    <div className="min-h-screen bg-stone-50 text-gray-900">
      <SimpleNavigation />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-xl font-semibold">React Router</h1>
          <p className="text-sm text-gray-700">
            ForesightLink wraps react-router-dom's Link. Move your cursor toward a link and the
            wrapper invokes <code className="font-mono">onPrefetch</code> before the click.
          </p>
        </header>

        <nav className="flex gap-3 text-sm">
          {ROUTES.map(({ to, name, label }) => (
            <ForesightLink
              key={to}
              to={to}
              name={name}
              hitSlop={20}
              className="px-3 py-2 border border-gray-400 text-gray-800 hover:bg-gray-100"
              onPrefetch={handlePrefetch}
            >
              {label}
            </ForesightLink>
          ))}
        </nav>

        <div className="text-xs text-gray-500 font-mono">current: {location.pathname}</div>

        <Routes>
          <Route
            index
            element={
              <DemoPage
                title="React Router demo"
                body="Pick a link above. Each link is wrapped in ForesightLink and triggers onPrefetch as soon as the manager predicts a click."
              />
            }
          />
          <Route
            path="about"
            element={<DemoPage title="About" body="About page reached via ForesightLink." />}
          />
          <Route
            path="contact"
            element={<DemoPage title="Contact" body="Contact page reached via ForesightLink." />}
          />
          <Route
            path="pricing"
            element={<DemoPage title="Pricing" body="Pricing page reached via ForesightLink." />}
          />
        </Routes>

        <section className="border border-gray-300 bg-white p-4 space-y-2">
          <h3 className="text-sm font-semibold">Prefetch log</h3>
          {prefetches.length === 0 ? (
            <p className="text-xs text-gray-500">No prefetches yet.</p>
          ) : (
            <ul className="space-y-1 text-xs font-mono">
              {prefetches.map(entry => (
                <li key={`${entry.to}-${entry.at}`} className="text-gray-800">
                  prefetch {entry.to}{" "}
                  <span className="text-gray-500">{new Date(entry.at).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default ReactRouterDemo
