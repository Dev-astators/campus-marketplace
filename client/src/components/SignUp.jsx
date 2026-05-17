import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import bgImage from "../assets/GreatHall.webp";
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
    <main className="grid min-h-screen bg-white font-['inter',sans-serif] lg:grid-cols-[1.45fr_0.55fr]">
      <aside
        className="relative hidden min-h-screen overflow-hidden px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(2, 15, 45, 0.90), rgba(15, 55, 150, 0.62), rgba(2, 15, 45, 0.55)), url('${bgImage}')`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        <header>
          <a
            href="/"
            className="text-xs font-bold uppercase tracking-[0.35em] text-white/80 transition hover:text-white"
          >
            UniSquare
          </a>
        </header>

        <section className="max-w-2xl">
          <h1 className="max-w-xl text-6xl font-black leading-[1.03] tracking-[-2.4px]">
            Elevate your{" "}
            <mark className="block bg-transparent text-orange-300">
              Campus
            </mark>
            <mark className="block bg-transparent text-orange-300">
              Experience.
            </mark>
          </h1>

          <em className="mt-8 inline-flex rounded-full border border-white/50 px-5 py-2 text-xs not-italic uppercase tracking-[0.22em] text-white">
            Exclusive Access
          </em>

          <p className="mt-8 max-w-md text-lg font-medium leading-8 text-white/90">
            Join a curated marketplace designed specifically for your university
            community. Secure, verified, and strictly academic.
          </p>

          <ul className="mt-12 grid max-w-2xl list-none grid-cols-1 gap-8 p-0 md:grid-cols-2">
            <li className="flex gap-5">
              <figure className="m-0 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-blue-300/40 bg-blue-400/10">
                <ShieldIcon />
              </figure>

              <article>
                <h2 className="text-base font-extrabold leading-6 text-white">
                  .students.wits.ac.za Verification
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/75">
                  Every member is verified through their official university
                  email for total trust.
                </p>
              </article>
            </li>

            <li className="flex gap-5">
              <figure className="m-0 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-blue-300/40 bg-blue-400/10">
                <UsersIcon />
              </figure>

              <article>
                <h2 className="text-base font-extrabold leading-6 text-white">
                  Peer-to-Peer
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/75">
                  Buy, sell, and trade directly with your colleagues and
                  students on campus.
                </p>
              </article>
            </li>
          </ul>
        </section>

        <footer>
          <small className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
            UniSquare © 2026
          </small>
        </footer>
      </aside>

      <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50/40 px-6 py-10">
        <article className="w-full max-w-[385px] rounded-[28px] border border-slate-200/80 bg-white/95 px-7 py-9 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <header className="text-center">
            <a
              href="/"
              className="text-3xl font-black tracking-[-1px] text-slate-950"
              aria-label="UniSquare home"
            >
              Uni
              <strong className="font-black text-blue-600">Square</strong>
            </a>

            <h1 className="mt-10 text-2xl font-extrabold tracking-[-0.6px] text-slate-950">
              Create Account
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Join your campus community today.
            </p>
          </header>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleGoogle();
            }}
            noValidate
            className="mt-8"
          >
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-slate-50 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              {loading ? "Redirecting..." : "Sign up with Google"}
            </button>

            <p className="mt-7 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <a
                onClick={() => navigate("/signin")}
                className="cursor-pointer font-bold text-blue-600 hover:underline"
              >
                Sign In
              </a>
            </p>
          </form>
        </article>
      </section>
    </main>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="h-7 w-7 text-blue-300"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 3.25L5.75 5.6v5.45c0 4.1 2.65 7.85 6.25 9.2 3.6-1.35 6.25-5.1 6.25-9.2V5.6L12 3.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.9 12.1l2.05 2.05 4.25-4.55"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="h-7 w-7 text-blue-300"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9.5 11.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M15.5 10.75a2.75 2.75 0 1 0 0-5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3.75 19.25c.55-3.15 2.65-5 5.75-5s5.2 1.85 5.75 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14.75 14.6c2.65.35 4.45 1.95 4.95 4.65"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.1 0 5.8 1.1 7.9 2.9l5.9-5.9C34.4 3.5 29.5 1.5 24 1.5 14.9 1.5 7.2 7 3.7 14.8l6.9 5.3C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7C43.8 37 46.5 31 46.5 24z"
      />
      <path
        fill="#FBBC05"
        d="M10.6 28.1A14.5 14.5 0 0 1 9.5 24c0-1.4.2-2.8.6-4.1l-6.9-5.3A22.6 22.6 0 0 0 1.5 24c0 3.6.9 7 2.4 10l6.7-5.9z"
      />
      <path
        fill="#34A853"
        d="M24 46.5c5.5 0 10.1-1.8 13.5-4.9l-7.4-5.7c-1.8 1.2-4.2 2-6.1 2-6.3 0-11.6-4.1-13.4-9.8l-6.7 5.9C7.2 41 14.9 46.5 24 46.5z"
      />
    </svg>
  );
}