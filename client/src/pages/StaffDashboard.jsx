import { useState } from "react";
import Sidebar from "../components/staff-dashboard/Sidebar";
import Topbar from "../components/staff-dashboard/Topbar";
import HeroBanner from "../components/staff-dashboard/HeroBanner";
import TodaysSchedule from "../components/staff-dashboard/TodaysSchedule";
import VerificationQueue from "../components/staff-dashboard/VerificationQueue";
import HelpDesk from "../components/staff-dashboard/HelpDesk";

export default function StaffDashboard() {
  const [activeNav, setActiveNav] = useState("meetups");
  return (
    <section
      className="flex bg-slate-100 min-h-screen font-sans"
      aria-label="Staff dashboard"
    >
      {/* Sidebar */}
      <aside aria-label="Staff navigation">
        <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
      </aside>

      {/* Main content */}
      <main className="ml-55 flex flex-col flex-1 min-h-screen">
        {/* Top bar */}
        <header>
          <Topbar />
        </header>

        {/* Page body */}
        <section className="flex-1 p-7" aria-label="Staff dashboard panels">
          <div className="grid grid-cols-[1fr_308px] gap-6 items-start">
            {/* ── Column 1 ── */}
            <section
              className="flex flex-col gap-6"
              aria-label="Schedule content"
            >
              <HeroBanner />
              <TodaysSchedule />
            </section>

            {/* ── Column 2 ── */}
            <aside
              className="flex flex-col gap-4"
              aria-label="Verification and support"
            >
              <VerificationQueue />
              <HelpDesk />
            </aside>
          </div>
        </section>
      </main>
    </section>
  );
}
