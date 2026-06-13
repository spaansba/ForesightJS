import { lazy, Suspense } from "react"
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom"
import { Navigation } from "./components/Navigation"
import { DebugProvider } from "./contexts/DebugContext"

const Home = lazy(() => import("./pages/home"))
const Elements = lazy(() => import("./pages/elements"))
const Mass = lazy(() => import("./pages/mass"))
const Events = lazy(() => import("./pages/events"))

const Layout = () => (
  <div className="min-h-screen bg-stone-50 text-gray-900">
    <Navigation />
    <Suspense>
      <Outlet />
    </Suspense>
  </div>
)

const App = () => {
  return (
    <DebugProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/elements" element={<Elements />} />
            <Route path="/mass" element={<Mass />} />
            <Route path="/events" element={<Events />} />
          </Route>
        </Routes>
      </Router>
    </DebugProvider>
  )
}

export default App
