import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import bgImage from "../assets/wits_great_hall.jpg"
import { useState } from "react";

export default function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error("Google sign-up error:", error.message);
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen font-['inter',sans-serif]">

      {/* ── Left Panel — hidden on mobile, visible md+ ── */}
      <aside
        className="hidden md:flex flex-1 flex-col justify-between p-10 text-white"
        style={{
          background: `linear-gradient(rgba(10,40,150,0.78), rgba(10,40,150,0.88)),
            url('${bgImage}') center/cover no-repeat`,
        }}
      >
        <p className="text-xs tracking-widest opacity-70 uppercase">Uni Square</p>

        <section>
          <h1 className="text-5xl font-extrabold leading-tight mb-5">
            Elevate your<br />
            <mark className="bg-transparent text-orange-300">
              Campus<br />Experience.
            </mark>
          </h1>

          <em className="not-italic inline-block border border-white/50 rounded-full px-4 py-1 text-[11px] tracking-widest uppercase mb-6">
            Exclusive Access
          </em>

          <p className="text-sm leading-relaxed opacity-85 max-w-xs mb-8">
            Join a curated marketplace designed specifically for your university
            community. Secure, verified, and strictly academic.
          </p>

          <ul className="flex gap-8 list-none p-0 m-0">
            {[
              {
                title: ".students.wits.ac.za Verification",
                desc: "Every member is verified through their official university email for total trust.",
              },
              {
                title: "Peer-to-Peer",
                desc: "Buy, sell, and trade directly with your colleagues and students on campus.",
              },
            ].map((f) => (
              <li key={f.title} className="flex gap-3 max-w-40">
                <article>
                  <p className="text-[13px] font-bold m-0">{f.title}</p>
                  <p className="text-[12px] opacity-75 leading-snug mt-1 m-0">{f.desc}</p>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <footer>
          <small className="text-[11px] tracking-widest opacity-60 uppercase">
            Uni Square © 2026
          </small>
        </footer>
      </aside>

      {/* ── Right Panel — full width on mobile, fixed width on md+ ── */}
      <section className="flex-1 md:flex-none md:w-105 bg-white flex flex-col justify-between p-8 md:p-10 md:shadow-[-4px_0_20px_rgba(0,0,0,0.08)]">

        {/* Logo */}
        <header>
          <a href="/" className="text-[15px] font-bold text-blue-600 no-underline hover:opacity-80 transition-opacity">
            UniSquare
          </a>
        </header>

        {/* Form area */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleGoogle(); }}
          noValidate
          className="flex flex-col gap-5"
        >
          <hgroup>
            <h2 className="text-3xl md:text-[1.8rem] font-extrabold text-gray-900 m-0">
              Create Account
            </h2>
            <p className="text-sm text-gray-500 mt-1 m-0">
              Join your campus community today.
            </p>
          </hgroup>

          <p className="text-[13px] text-gray-500 m-0">
            Already have an account?{" "}
            <a
              onClick={() => navigate("/signin")}
              className="text-blue-600 font-semibold cursor-pointer hover:underline"
            >
              Sign In
            </a>
          </p>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-3 border-[1.5px] border-gray-200 rounded-full px-6 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 active:scale-[.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer w-full md:w-fit justify-center md:justify-start mb-60"
          >
            <GoogleIcon />
            {loading ? "Redirecting..." : "Sign up with Google"}
          </button>
        </form>

      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.1 0 5.8 1.1 7.9 2.9l5.9-5.9C34.4 3.5 29.5 1.5 24 1.5 14.9 1.5 7.2 7 3.7 14.8l6.9 5.3C12.4 13.6 17.7 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7C43.8 37 46.5 31 46.5 24z"/>
      <path fill="#FBBC05" d="M10.6 28.1A14.5 14.5 0 0 1 9.5 24c0-1.4.2-2.8.6-4.1l-6.9-5.3A22.6 22.6 0 0 0 1.5 24c0 3.6.9 7 2.4 10l6.7-5.9z"/>
      <path fill="#34A853" d="M24 46.5c5.5 0 10.1-1.8 13.5-4.9l-7.4-5.7c-1.8 1.2-4.2 2-6.1 2-6.3 0-11.6-4.1-13.4-9.8l-6.7 5.9C7.2 41 14.9 46.5 24 46.5z"/>
    </svg>
  );
}
