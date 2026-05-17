import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import bgImage from "../assets/wits_great_hall.jpg";
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
    <main className="flex min-h-screen flex-col font-['inter',sans-serif] lg:flex-row">
      <aside
        className="hidden flex-1 flex-col justify-between p-8 text-white lg:flex lg:p-10"
        style={{
          background: `linear-gradient(rgba(10,40,150,0.78), rgba(10,40,150,0.88)),
            url('${bgImage}') center/cover no-repeat`,
        }}
      >
        <p className="text-xs uppercase tracking-widest opacity-70">
          Uni Square
        </p>

        <section>
          <h1 className="mb-5 text-4xl font-extrabold leading-tight xl:text-5xl">
            Elevate your
            <br />
            <mark className="bg-transparent text-orange-300">
              Campus
              <br />
              Experience.
            </mark>
          </h1>

          <p className="mb-6 inline-block rounded-full border border-white/50 px-4 py-1 text-[11px] uppercase tracking-widest">
            Exclusive Access
          </p>

          <p className="mb-8 max-w-xs text-sm leading-relaxed opacity-85">
            Join a curated marketplace designed specifically for your university
            community. Secure, verified, and strictly academic.
          </p>

          <ul className="m-0 flex list-none flex-col gap-4 p-0 sm:flex-row sm:gap-8">
            {[
              {
                title: ".students.wits.ac.za Verification",
                desc: "Every member is verified through their official university email for total trust.",
              },
              {
                title: "Peer-to-Peer",
                desc: "Buy, sell, and trade directly with your colleagues and students on campus.",
              },
            ].map((feature) => (
              <li key={feature.title} className="max-w-48">
                <article>
                  <h2 className="m-0 text-[13px] font-bold">{feature.title}</h2>
                  <p className="m-0 mt-1 text-[12px] leading-snug opacity-75">
                    {feature.desc}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <footer>
          <small className="text-[11px] uppercase tracking-widest opacity-60">
            Uni Square © 2026
          </small>
        </footer>
      </aside>

      <section className="flex min-h-screen flex-1 flex-col justify-between bg-white p-6 sm:p-8 lg:min-h-0 lg:max-w-[28rem] lg:p-10 lg:shadow-[-4px_0_20px_rgba(0,0,0,0.08)] xl:max-w-[32rem]">
        <header>
          <a
            href="/"
            className="text-[15px] font-bold text-blue-600 no-underline transition-opacity hover:opacity-80"
          >
            UniSquare
          </a>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleGoogle();
          }}
          noValidate
          className="flex flex-col gap-5 py-10 lg:py-0"
        >
          <hgroup>
            <h2 className="m-0 text-3xl font-extrabold text-gray-900">
              Create Account
            </h2>
            <p className="m-0 mt-1 text-sm text-gray-500">
              Join your campus community today.
            </p>
          </hgroup>

          <p className="m-0 text-[13px] text-gray-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="font-semibold text-blue-600 hover:underline"
            >
              Sign In
            </button>
          </p>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit sm:justify-start"
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
