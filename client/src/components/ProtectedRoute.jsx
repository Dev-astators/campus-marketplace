import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile && allowedRoles.includes(profile.role)) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }

      setLoading(false);
    };

    checkAccess();
  }, [allowedRoles]);

  if (loading) return <p>Loading...</p>;

  if (!authorized) return <Navigate to="/signin" />;

  return children;
}