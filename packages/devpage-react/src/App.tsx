import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Main } from "./components/MainWrapper"
import Mass from "./pages/mass"
import ImageGallery from "./pages/images"
import { DebugProvider } from "./contexts/DebugContext"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"

function App() {
  return (
    <DebugProvider>
      {/* <TanStackDevtools
        plugins={[
          {
            id: "tanstack-query",
            name: "TanStack Query",
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: "TanStack Query",
            render: <ReactQueryDevtoolsPanel />,
          },
        ]}
      /> */}
      <Router>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/mass" element={<Mass />} />
          <Route path="/images" element={<ImageGallery />} />
        </Routes>
      </Router>
    </DebugProvider>
  )
}

export default App
