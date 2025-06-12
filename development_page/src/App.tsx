import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Main } from "./components/MainWrapper"
import Other from "./pages/other"
import Mass from "./pages/mass"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/other" element={<Other />} />
        <Route path="/mass" element={<Mass />} />
      </Routes>
    </Router>
  )
}

export default App
