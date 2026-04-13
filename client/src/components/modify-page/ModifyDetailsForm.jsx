import { useState } from "react";
import IdentitySelector from "./IdentitySelector";

export default function ModifyDetailsForm({ onConfirm }) {
  const [role, setRole]         = useState("student");
  const [username, setUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm?.({ role, username });
  };

  return (
    <section
      aria-labelledby="setup-heading"
      className="flex flex-col justify-center px-16 py-20 bg-white"
    >
      <article className="max-w-md w-full mx-auto">
        {/* Heading */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
          {/* Role picker */}
          <IdentitySelector selected={role} onChange={setRole} />

          {/* Username */}
          <section aria-label="Username field">
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-gray-700 mb-2 font-['inter',sans-serif]"
            >
              Username{" "}
              <small className="font-normal text-slate-400">(Optional)</small>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="enter your username"
              className="w-full bg-slate-100 rounded-xl px-4 py-3.5 text-sm text-gray-700 placeholder-slate-400 border border-transparent focus:outline-none focus:border-blue-400 focus:bg-white transition-all font-['inter',sans-serif]"
            />
          </section>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 active:scale-[.98] text-white font-semibold text-sm py-4 rounded-2xl transition-all duration-150 flex items-center justify-center gap-2 font-['inter',sans-serif] cursor-pointer"
          >
            Confirm
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </article>
    </section>
  );
}