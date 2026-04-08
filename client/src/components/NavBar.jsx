import { useState } from "react";


export default function Navbar() {
  const [activeNav, setActiveNav] = useState("Buy");

  return (
    <nav className="flex items-center justify-between px-16 py-5 border-b border-gray-100">
      {/* Logo */}
      <span className="text-blue-600 font-['inter',sans-serif] font-bold text-xl tracking-tight select-none">
        <span className="text-black">Uni</span>Square
      </span>



      {/* Auth Buttons */}
      <div className="flex items-center gap-4">

        <button className="text-sm font-['inter',sans-serif] font-medium text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
          About
        </button>

        <button className="text-sm font-['inter',sans-serif] font-medium text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
          Sign In
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-['inter',sans-serif] font-semibold px-5 py-2.5 rounded-full transition-colors shadow-sm cursor-pointer">
          Get Started
        </button>
      </div>
    </nav>
  );
}