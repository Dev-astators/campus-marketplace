import { useState } from "react";
import Sidebar from "../components/staff-dashboard/Sidebar";
import Topbar from "../components/staff-dashboard/Topbar";
import HeroBanner from "../components/staff-dashboard/HeroBanner";
import TodaysSchedule from "../components/staff-dashboard/TodaysSchedule";
import VerificationQueue from "../components/staff-dashboard/VerificationQueue";
import HelpDesk from "../components/staff-dashboard/HelpDesk";

export default function StaffDashboard() {
  const [activeNav, setActiveNav] = useState("marketplace");

  return (
    <div className="flex min-h-screen bg-white text-white font-sans overflow-hidden">
      
      {/* ================= SIDEBAR ================= */}
      <Sidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex flex-col flex-1 ml-55">
        
        {/* ================= TOPBAR ================= */}
        <Topbar />

        {/* ================= PAGE CONTENT ================= */}
        <main className="flex-1 px-10 py-8">
          
          {/* Main layout exactly like screenshot */}
          <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
            
            {/* ================= LEFT SECTION ================= */}
            <div className="flex flex-col gap-6">

              {/* Hero / Welcome Banner */}
              <div className="rounded-3xl bg-white border  shadow-lg p-8">
                <HeroBanner />
              </div>

              {/* Today's Schedule Section */}
              <div className="rounded-3xl bg-white border  shadow-lg p-6">
                <TodaysSchedule />
              </div>

            </div>
            {/* ================= RIGHT SECTION ================= */}
            <div className="flex flex-col gap-6">

              {/* Verification Queue */}
              <div className="rounded-3xl bg-white border  shadow-lg p-5">
                <VerificationQueue />
              </div>

              {/* Help Desk */}
              <div className="rounded-3xl bg-white border  shadow-lg p-5">
                <HelpDesk />
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}