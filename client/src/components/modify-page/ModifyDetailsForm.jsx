import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import IdentitySelector from "./IdentitySelector";

export default function ModifyDetailsForm() {
  const navigate = useNavigate();

  const [role, setRole]                   = useState("student");
  const [studentNumber, setStudentNumber] = useState("");
  const [loading, setLoading]             = useState(false);
  const [checking, setChecking]           = useState(true);
  const [error, setError]                 = useState(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  // No session → /signup
  // Already has a role → /dashboard (skip setup)
  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/signup");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (profile?.role) {
        navigate("/student-dashboard");
        return;
      }

      setChecking(false);
    };

    checkProfile();
  }, [navigate]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        role,
        student_number: studentNumber.trim() || null,
      })
      .eq("auth_user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    navigate("/student-dashboard");
  };

  // Render nothing while auth check runs
  if (checking) return null;

  return (
    <section
      aria-labelledby="setup-heading"
      className="flex flex-col justify-center px-16 py-20 bg-white"
    >
      <article className="max-w-md w-full mx-auto">
        <header className="mb-8">
          <h2
            id="setup-heading"
            className="text-4xl font-extrabold text-gray-900 mb-2 font-['inter',sans-serif]"
          >
            Let's set you up!
          </h2>
          <p className="text-slate-500 text-sm font-['inter',sans-serif]">
            Modify your user details
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
          <IdentitySelector selected={role} onChange={setRole} />

          <section aria-label="Student number field">
            <label
              htmlFor="student_number"
              className="block text-sm font-semibold text-gray-700 mb-2 font-['inter',sans-serif]"
            >
              Student Number{" "}
              <small className="font-normal text-slate-400">(Optional)</small>
            </label>
            <input
              id="student_number"
              type="text"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="e.g. 1234567"
              className="w-full bg-slate-100 rounded-xl px-4 py-3.5 text-sm text-gray-700 placeholder-slate-400 border border-transparent focus:outline-none focus:border-blue-400 focus:bg-white transition-all font-['inter',sans-serif]"
            />
          </section>

          {error && (
            <output role="alert" className="text-red-500 text-sm font-['inter',sans-serif]">
              {error}
            </output>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 active:scale-[.98] text-white font-semibold text-sm py-4 rounded-2xl transition-all duration-150 flex items-center justify-center gap-2 font-['inter',sans-serif] cursor-pointer"
          >
            {loading ? "Saving..." : "Confirm →"}
          </button>
        </form>
      </article>
    </section>
  );
}