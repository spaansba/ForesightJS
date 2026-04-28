import Link from "next/link"

export const Nav = () => {
  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-base font-semibold text-gray-900">
          ForesightJS Next.js
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-700 hover:text-gray-900">
            Home
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-gray-900">
            About
          </Link>
          <Link href="/contact" className="text-gray-700 hover:text-gray-900">
            Contact
          </Link>
          <Link href="/pricing" className="text-gray-700 hover:text-gray-900">
            Pricing
          </Link>
        </nav>
      </div>
    </header>
  )
}
