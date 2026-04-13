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
    <div className="flex bg-slate-100 min-h-screen font-sans">
      {/* Sidebar */}
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
 
 
      {/* Main content */}
      <div className="ml-55 flex flex-col flex-1 min-h-screen">
        {/* Top bar */}
        <Topbar />

        {/* Page body */}
        <main className="flex-1 p-7">
          <div className="grid grid-cols-[1fr_308px] gap-6 items-start">
            {/* ── Column 1 ── */}
            <div className="flex flex-col gap-6">
              <HeroBanner />
              <TodaysSchedule />
            </div>

            {/* ── Column 2 ── */}
            <div className="flex flex-col gap-4">
              <VerificationQueue />
              <HelpDesk />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
