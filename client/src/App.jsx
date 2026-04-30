import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './config/supabaseClient';
import './App.css'
import WelcomePage from './pages/WelcomePage'
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import StaffDashboard from './pages/StaffDashboard';
import StudentDashboard  from './pages/StudentDashboard';
import ListingDetails from './pages/ListingDetails';
import CreateListing from './pages/CreateListing';
import ChatPage from './pages/ChatPage';
import SellerProfilePage from './pages/SellerProfilePage';
import MessagesPage from './pages/MessagesPage';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from "./components/ProtectedRoute";
import Onboarding from "./components/Onboarding";


function App() {
  const [session, setSession] = useState(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const navigate = useNavigate(); // ✅

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

  useEffect(() => {
    const checkUserRole = async () => {
      if (!session || hasRedirected) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!profile) return;

      setHasRedirected(true); // ✅ prevents loop

      if (profile.role === "student") {
        navigate("/student-dashboard");
      } else if (profile.role === "facility_staff") {
        navigate("/staff-dashboard");
      }
    };

    checkUserRole();
  }, [session, hasRedirected, navigate]);

  return (
    <>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route path="/staff-dashboard" element={
          <ProtectedRoute allowedRoles={["facility_staff"]}>
            <StaffDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student-dashboard" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/listing/:id" element={<ListingDetails />} />
        <Route path="/create-listing" element={<CreateListing />} />
        <Route path="/chat/:id" element={<ChatPage/>}/>
        <Route path="/seller-profile" element={<SellerProfilePage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={
          <ProtectedRoute allowedRoles={["student", "facility_staff"]}>
            <Onboarding />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  )


}

export default App;
