"use client"

import { ForesightLink } from "./ForesightLink"

const ROUTES = [
  { href: "/about", name: "next-about", label: "About" },
  { href: "/contact", name: "next-contact", label: "Contact" },
  { href: "/pricing", name: "next-pricing", label: "Pricing" },
] as const

export const ForesightLinkDemo = () => {
  return (
    <div className="flex gap-3 text-sm">
      {ROUTES.map(({ href, name, label }) => (
        <ForesightLink
          key={href}
          href={href}
          name={name}
          hitSlop={20}
          meta={{ source: "next-demo" }}
          className="inline-flex items-center px-3 py-2 border border-gray-400 text-gray-800 bg-white hover:bg-gray-100"
        >
          {label}
        </ForesightLink>
      ))}
    </div>
  )
}
