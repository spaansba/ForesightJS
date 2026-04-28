import Link from "next/link"
import { ForesightLink } from "./ForesightLink"

export const Nav = () => {
  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-base font-semibold text-gray-900">
          ForesightJS Next.js
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <ForesightLink
            href="/"
            name="nav-home"
            hitSlop={10}
            className="text-gray-700 hover:text-gray-900"
          >
            Home
          </ForesightLink>
          <ForesightLink
            href="/about"
            name="nav-about"
            hitSlop={10}
            className="text-gray-700 hover:text-gray-900"
          >
            About
          </ForesightLink>
          <ForesightLink
            href="/contact"
            name="nav-contact"
            hitSlop={10}
            className="text-gray-700 hover:text-gray-900"
          >
            Contact
          </ForesightLink>
          <ForesightLink
            href="/pricing"
            name="nav-pricing"
            hitSlop={10}
            className="text-gray-700 hover:text-gray-900"
          >
            Pricing
          </ForesightLink>
        </nav>
      </div>
    </header>
  )
}
