import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import WelcomePage from './pages/WelcomePage'
import SignInPage from './pages/SignInPage';

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}


export default App;
