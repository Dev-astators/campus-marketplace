import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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
import PaymentPage from "./pages/PaymentPage";
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
  // undefined = still loading, null = no session, object = active session
  const [session, setSession] = useState(undefined);
  const navigate = useNavigate();
  const location = useLocation();

  // Prevents running a redirect more than once per distinct session.
  // Cleared to false whenever the auth state actually changes so that
  // sign-in / sign-out always triggers a fresh redirect.
  const redirectedRef = useRef(false);

  // ── Auth listener ────────────────────────────────────────────────────────
  // onAuthStateChange fires immediately with INITIAL_SESSION on mount,
  // so there is no need for a separate getSession() call. Calling both
  // causes two setSession() calls and therefore two re-renders + two
  // syncRoleRedirect executions on every page load.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // Allow one redirect per auth transition (sign-in, sign-out, token refresh)
      redirectedRef.current = false;
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Role-based redirect ──────────────────────────────────────────────────
  // Depends only on `session`, NOT on location.pathname.
  //
  // Why not location.pathname?
  //   If we include it, every navigate() call changes the pathname, which
  //   re-triggers this effect, which calls resolveUserDashboardPath (a
  //   Supabase query) again — creating a query-on-every-navigation loop.
  //
  // Instead we read location.pathname via the ref-like closure at call time.
  // The ref guard (redirectedRef) ensures we only redirect once per session.
  useEffect(() => {
    // Still waiting for the initial INITIAL_SESSION event — do nothing
    if (session === undefined) return;

    // Signed out — let the route render handle showing the welcome/sign-in page
    if (!session?.user) return;

    // Already redirected for this session; don't repeat the Supabase query
    if (redirectedRef.current) return;

    const doRedirect = async () => {
      const nextPath = await resolveUserDashboardPath(session.user);

      const currentPath = location.pathname;
      const isAuthEntryPath = ["/", "/signin", "/signup"].includes(currentPath);
      const isWrongDashboard =
        isDashboardPath(currentPath) && currentPath !== nextPath;

      if ((isAuthEntryPath || isWrongDashboard) && currentPath !== nextPath) {
        redirectedRef.current = true;
        navigate(nextPath, { replace: true });
      }
    };

    doRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]); // ← intentionally omitting location.pathname and navigate

  if (session === undefined) {
    // Render nothing (or a spinner) while we wait for the auth state to load.
    // This prevents a flash of the wrong route before the redirect fires.
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/staff-dashboard" element={<StaffDashboard />} />
      <Route path="/facility-dashboard" element={<StaffDashboard />} />
      <Route
        path="/facility-dashboard/:facilityId"
        element={<StaffDashboard />}
      />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/listing/:id" element={<ListingDetails />} />
      <Route path="/create-listing" element={<CreateListing />} />
      <Route path="/chat/:id" element={<ChatPage />} />
      <Route path="/seller-profile" element={<SellerProfilePage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/payment/success" element={<PaymentPage result="success" />} />
      <Route path="/payment/cancel" element={<PaymentPage result="cancel" />} />
    </Routes>
  );
}

export default App;
