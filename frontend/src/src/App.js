import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import About from './pages/About';
import Homepage from './pages/Homepage';
import Main from './pages/Main';
import Results from './pages/Results';
function App() {
  return (
    <>
    <Router>
      <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path ="/main" element = {<Main />} />
      <Route path ="/about" element = {<About />} />
      <Route path ="/results" element = {<Results />} />
      </Routes>
    </Router>
    </>
  );
}

export default App;
