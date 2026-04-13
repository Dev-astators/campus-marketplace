import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import WelcomePage from './pages/WelcomePage'
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import StaffDashboard from './pages/StaffDashboard';


function App() {

  return (
    <>
      {/* <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
        </Routes>
      </BrowserRouter> */}
      <StaffDashboard />
    </>
  )


}

export default App;
