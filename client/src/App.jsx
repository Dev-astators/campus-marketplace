import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

/* ---------- FIXED COMPONENT ---------- */
function DashboardRedirect({ session, role }) {
  if (!session) return <Navigate to="/" replace />;

  if (role === "student") {
    return <Navigate to="/student-dashboard" replace />;
  }

  if (role === "facility_staff") {
    return <Navigate to="/staff-dashboard" replace />;
  }

  if (role === "admin") {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}

/* ---------- OPTIONAL PROTECTED ROUTE ---------- */
function ProtectedRoute({ session, allowedRoles, role, children }) {
  if (!session) return <Navigate to="/signin" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/auth/callback" replace />;
  }

  return children;
}

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchRole(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setRole(data.role);
    } else {
      setRole(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user) {
        await fetchRole(session.user.id);
      } else {
        setLoading(false);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        await fetchRole(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* OAuth Return */}
        <Route
          path="/auth/callback"
          element={<DashboardRedirect session={session} role={role} />}
        />

        {/* Student */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute
              session={session}
              role={role}
              allowedRoles={["student"]}
            >
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Staff */}
        <Route
          path="/staff-dashboard"
          element={
            <ProtectedRoute
              session={session}
              role={role}
              allowedRoles={["facility_staff", "admin"]}
            >
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute
              session={session}
              role={role}
              allowedRoles={["admin"]}
            >
              <div>Admin Dashboard</div>
            </ProtectedRoute>
          }
        />

        {/* Other protected pages */}
        <Route path="/listing/:id" element={<ListingDetails />} />
        <Route path="/create-listing" element={<CreateListing />} />
        <Route path="/chat/:id" element={<ChatPage />} />
        <Route path="/seller-profile" element={<SellerProfilePage />} />
        <Route path="/messages" element={<MessagesPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
