import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Main } from "./components/MainWrapper"
import Mass from "./pages/mass"
import ImageGallery from "./pages/images"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/mass" element={<Mass />} />
        <Route path="/images" element={<ImageGallery />} />
      </Routes>
    </Router>
  )
}

export default App
