import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import WelcomePage from './pages/WelcomePage'
import SignUpPage from './pages/SignUpPage';


function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}


export default App;
