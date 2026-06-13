import { ForesightLink } from "./ForesightLink"
import { routeImports } from "../routes"

export const Navigation = () => {
  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <ForesightLink
          to="/"
          name="nav-logo"
          className="text-base font-semibold text-gray-900"
          onPrefetch={() => routeImports["/"]()}
        >
          ForesightJS Dev
        </ForesightLink>
        <nav className="flex items-center gap-4 text-sm">
          <ForesightLink
            to="/"
            name="nav-home"
            className="text-gray-700 hover:text-gray-900"
            onPrefetch={() => routeImports["/"]()}
          >
            Home
          </ForesightLink>
          <ForesightLink
            to="/elements"
            name="nav-elements"
            className="text-gray-700 hover:text-gray-900"
            onPrefetch={() => routeImports["/elements"]()}
          >
            Elements
          </ForesightLink>
          <ForesightLink
            to="/mass"
            name="nav-mass"
            className="text-gray-700 hover:text-gray-900"
            onPrefetch={() => routeImports["/mass"]()}
          >
            Mass test
          </ForesightLink>
          <ForesightLink
            to="/events"
            name="nav-events"
            className="text-gray-700 hover:text-gray-900"
            onPrefetch={() => routeImports["/events"]()}
          >
            Events
          </ForesightLink>
        </nav>
      </div>
    </header>
  )
}
