import { useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/signin");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error || !profile) {
        console.error(error);
        navigate("/signin");
        return;
      }

      if (profile.role === "student") {
        navigate("/student-dashboard");
      } else if (profile.role === "facility_staff") {
        navigate("/staff-dashboard");
      } else {
        navigate("/");
      }
    };

    handleAuth();
  }, [navigate]);

  return <p className="text-center mt-10">Signing you in...</p>;
}