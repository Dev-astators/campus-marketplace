import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./config/supabaseClient";
import "./App.css";
import WelcomePage from "./pages/WelcomePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import StaffDashboard from "./pages/StaffDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ListingDetails from "./pages/ListingDetails";
import CreateListing from "./pages/CreateListing";
import ChatPage from "./pages/ChatPage";
import SellerProfilePage from "./pages/SellerProfilePage";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminDashboard from "./pages/AdminDashboard";
import {
  isDashboardPath,
  resolveUserDashboardPath,
} from "./utils/roleRedirect";

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      console.log("Logged in:", session.user);
    } else {
      console.log("No user logged in");
    }
  }, [session]);

  useEffect(() => {
    const syncRoleRedirect = async () => {
      if (!session?.user) {
        return;
      }

      const nextPath = await resolveUserDashboardPath(session.user);
      const isAuthEntryPath =
        location.pathname === "/" ||
        location.pathname === "/signin" ||
        location.pathname === "/signup";

      if (isAuthEntryPath && location.pathname !== nextPath) {
        navigate(nextPath, { replace: true });
        return;
      }

      if (
        isDashboardPath(location.pathname) &&
        location.pathname !== nextPath
      ) {
        navigate(nextPath, { replace: true });
      }
    };

    syncRoleRedirect();
  }, [location.pathname, navigate, session]);

  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/staff-dashboard" element={<StaffDashboard />} />
      <Route path="/facility-dashboard" element={<StaffDashboard />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/listing/:id" element={<ListingDetails />} />
      <Route path="/create-listing" element={<CreateListing />} />
      <Route path="/chat/:id" element={<ChatPage />} />
      <Route path="/seller-profile" element={<SellerProfilePage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
