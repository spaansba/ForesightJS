"use client"

import { useRef, useState } from "react"
import { ForesightLink } from "./ForesightLink"

type PrefetchEntry = {
  to: string
  at: number
}

const ROUTES = [
  { href: "/about", name: "next-about", label: "About" },
  { href: "/contact", name: "next-contact", label: "Contact" },
  { href: "/pricing", name: "next-pricing", label: "Pricing" },
] as const

export const ForesightLinkDemo = () => {
  const [prefetches, setPrefetches] = useState<PrefetchEntry[]>([])
  const cacheRef = useRef<Set<string>>(new Set())

  const handlePrefetch = (to: string) => {
    if (cacheRef.current.has(to)) {
      return
    }

    cacheRef.current.add(to)
    setPrefetches(prev => [{ to, at: Date.now() }, ...prev].slice(0, 10))
  }

  return (
    <>
      <div className="flex gap-3 text-sm">
        {ROUTES.map(({ href, name, label }) => (
          <ForesightLink
            key={href}
            href={href}
            name={name}
            hitSlop={20}
            meta={{ source: "next-demo" }}
            onForesightHit={() => handlePrefetch(href)}
          >
            {label}
          </ForesightLink>
        ))}
      </div>

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
    </>
  )
}
