import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './config/supabaseClient';
import './App.css'
import WelcomePage from './pages/WelcomePage'
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import StaffDashboard from './pages/StaffDashboard';
import ModifyDetailsPage from './pages/ModifyDetailsPage';
import StudentDashboard  from './pages/StudentDashboard';
import SellerProfilePage from './pages/SellerProfilePage';
import MessagesPage from './pages/MessagesPage';


function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

    useEffect(() => {
    if (session) {
      console.log("Logged in:", session.user.email);
    } else {
      console.log("No user logged in");
    }
  }, [session]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
          <Route path="/modify-details" element={<ModifyDetailsPage />} />
          <Route path="/student-dashboard" element={<StudentDashboard/>} />
          <Route path="/seller-profile" element={<SellerProfilePage />} />
          <Route path="/messages" element={<MessagesPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )


}

export default App;
