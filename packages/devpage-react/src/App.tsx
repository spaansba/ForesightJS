import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Main } from "./components/MainWrapper"
import Mass from "./pages/mass"
import ImageGallery from "./pages/images"
import ReactRouterDemo from "./pages/react-router"
import { DebugProvider } from "./contexts/DebugContext"

const App = () => {
  return (
    <DebugProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/mass" element={<Mass />} />
          <Route path="/images" element={<ImageGallery />} />
          <Route path="/react-router/*" element={<ReactRouterDemo />} />
        </Routes>
      </Router>
    </DebugProvider>
  )
}

export default App
