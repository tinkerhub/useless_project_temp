import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import Results from "./pages/Results";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;