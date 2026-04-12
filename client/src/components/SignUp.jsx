import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { useState } from "react";  
import "../App.css";



export default function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.error("Google sign-up error:", error.message);
      setLoading(false);
    }
  };
  
  return (
    <section style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* Left Panel */}
      <div style={{
        flex: 1, position: "relative", background: `linear-gradient(rgba(10,40,150,0.75),rgba(10,40,150,0.85)),
          url('https://images.unsplash.com/photo-1562774053-701939374585?w=900') center/cover`,
        color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2.5rem"
      }}>
        <div style={{ fontSize: 13, letterSpacing: 1, opacity: 0.7 }}>UNI SQUARE</div>

        <div>
          <h1 style={{ fontSize: "2.6rem", fontWeight: 800, lineHeight: 1.15, margin: "0 0 1rem" }}>
            Elevate your<br />
            <span style={{ color: "#f97316" }}>Campus<br />Experience.</span>
          </h1>
          <span style={{ border: "1px solid rgba(255,255,255,0.5)", borderRadius: 20, padding: "4px 14px", fontSize: 11, letterSpacing: 1 }}>
            EXCLUSIVE ACCESS
          </span>
          <p style={{ margin: "1rem 0 2rem", fontSize: 14, opacity: 0.85, lineHeight: 1.6, maxWidth: 320 }}>
            Join a curated marketplace designed specifically for your university community. Secure, verified, and strictly academic.
          </p>
          <div style={{ display: "flex", gap: "2rem" }}>
            {[
              { icon: "🛡", title: ".students.wits.ac.za Verification", desc: "Every member is verified through their official university email for total trust." },
              { icon: "👥", title: "Peer-to-Peer", desc: "Buy, sell, and trade directly with your colleagues and students on campus." }
            ].map(f => (
              <div key={f.title} style={{ display: "flex", gap: 10, maxWidth: 160 }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{f.title}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.75, lineHeight: 1.4 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "2rem", fontSize: 11, letterSpacing: 1, opacity: 0.6 }}>
          <span>UNI SQUARE © 2026</span>
          
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        width: 420, background: "#fff", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "2.5rem", boxShadow: "-4px 0 20px rgba(0,0,0,0.08)"
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1a56db" }}>UniSquare</div>

        <div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 .5rem" }}>Create Account</h2>
          <p style={{ color: "#555", margin: "0 0 1.5rem", fontSize: 14 }}>Join your campus community today.</p>
          <p style={{ fontSize: 13, color: "#555", margin: "0 0 1.5rem" }}>
            Already have an account?{" "}
            <a onClick={()=> navigate('/signin')} style={{ color: "#1a56db", fontWeight: 600, textDecoration: "none", cursor: "pointer" }}>Sign In</a>
          </p>

          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: "1.5px solid #ddd",
              borderRadius: 24,
              padding: "10px 22px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              background: "#fff",
              color: "#333",
              marginBottom: 150,
              transition: "all 0.15s ease",
              opacity: loading ? 0.7 : 1
            }}
          >
            {/* Google Icon */}
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.1 0 5.8 1.1 7.9 2.9l5.9-5.9C34.4 3.5 29.5 1.5 24 1.5 14.9 1.5 7.2 7 3.7 14.8l6.9 5.3C12.4 13.6 17.7 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7C43.8 37 46.5 31 46.5 24z"/>
              <path fill="#FBBC05" d="M10.6 28.1A14.5 14.5 0 0 1 9.5 24c0-1.4.2-2.8.6-4.1l-6.9-5.3A22.6 22.6 0 0 0 1.5 24c0 3.6.9 7 2.4 10l6.7-5.9z"/>
              <path fill="#34A853" d="M24 46.5c5.5 0 10.1-1.8 13.5-4.9l-7.4-5.7c-1.8 1.2-4.2 2-6.1 2-6.3 0-11.6-4.1-13.4-9.8l-6.7 5.9C7.2 41 14.9 46.5 24 46.5z"/>
            </svg>

            {loading ? "Redirecting..." : "Sign up with Google"}
          </button>

        </div>

      </div>
    </section>
  );
}
