"use client"

import { ForesightLink } from "./ForesightLink"
import { useState } from "react"
import { useForesightEvent } from "@foresightjs/react"

const ROUTES = [
  { href: "/about", name: "next-about", label: "About" },
  { href: "/contact", name: "next-contact", label: "Contact" },
  { href: "/pricing", name: "next-pricing", label: "Pricing" },
] as const

export const ForesightLinkDemo = () => {
  const [callbackHref, setCallbackHref] = useState<string>()
  const [eventHref, setEventHref] = useState<string>()

  useForesightEvent("callbackInvoked", event => {
    setEventHref(event.state.meta.href)
  })

  return (
    <div className="space-y-3">
      <div className="flex gap-3 text-sm">
        {ROUTES.map(({ href, name, label }) => (
          <ForesightLink
            key={href}
            href={href}
            name={name}
            hitSlop={20}
            meta={{ href }}
            onPrefetch={setCallbackHref}
            className="inline-flex items-center px-3 py-2 border border-gray-400 text-gray-800 bg-white hover:bg-gray-100"
          >
            {label}
          </ForesightLink>
        ))}
      </div>
      <p className="text-xs text-gray-500">Hover a link to read its typed metadata.</p>
      <div className="font-mono text-xs text-gray-700 space-y-1">
        <div>callback meta.href: {callbackHref ?? "waiting"}</div>
        <div>event meta.href: {eventHref ?? "waiting"}</div>
      </div>
    </div>
  )
}
