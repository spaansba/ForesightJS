import { ForesightLinkDemo } from "./components/ForesightLinkDemo"

const HomePage = () => {
  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">Next.js + ForesightJS</h1>
        <p className="text-sm text-gray-700 leading-relaxed">
          <strong>
            Run a production build (pnpm build && pnpm start) to actually observe network
            prefetches, Next does not prefetch in dev.
          </strong>
        </p>
      </header>
      <ForesightLinkDemo />
    </main>
  )
}

export default HomePage
