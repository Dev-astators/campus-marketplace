import { useState } from "react";
import Sidebar from "../components/staff-dashboard/Sidebar";
import Topbar from "../components/staff-dashboard/Topbar";
import HeroBanner from "../components/staff-dashboard/HeroBanner";

import FacilityOverview from "../components/staff-dashboard/FacilityOverview";
import BookingScheduleBoard from "../components/staff-dashboard/BookingScheduleBoard";
import TransactionFlowPanel from "../components/staff-dashboard/TransactionFlowPanel";
import ActivityFeed from "../components/staff-dashboard/ActivityFeed";
import StaffProfileSettings from "../components/staff-dashboard/StaffProfileSettings";
import useStaffDashboard from "../hooks/useStaffDashboard";

export default function StaffDashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const {
    activeNav,
    setActiveNav,
    viewContent,
    heroStats,
    staffProfile,
    facilityProfile,
    facilityHours,
    todaysBookings,
    totalCapacity,
    totalBookedSlots,
    pendingTransactions,
    fullSlots,
    transactionQueue,
    confirmedTransactionQueue,
    activityLog,
    selectedDate,
    changeSelectedDate,
    advanceTransaction,
    loading,
    error,
    actionLoadingId,
  } = useStaffDashboard();

  const showFacilityOverview = activeNav === "bookings";
  const showBookingSchedule = activeNav === "bookings" || activeNav === "meetups";
  const showTransactionFlow =
    activeNav === "bookings" ||
    activeNav === "verification" ||
    activeNav === "confirmed";
  const showingConfirmedTransactions = activeNav === "confirmed";
  const isProfileView = activeNav === "profile";
  const visibleTransactions = showingConfirmedTransactions
    ? confirmedTransactionQueue
    : transactionQueue;
  const sidebarOffsetClass = isSidebarCollapsed
    ? "lg:ml-[5.5rem]"
    : "lg:ml-[16rem]";

  const toggleSidebar = () => {
    setIsSidebarCollapsed((previous) => !previous);
  };

  const handleNavChange = (nextNav) => {
    setActiveNav(nextNav);
    setIsMobileSidebarOpen(false);
  };

  return (
    <section className="flex min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <Sidebar
        activeNav={activeNav}
        onNavChange={handleNavChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        isMobileOpen={isMobileSidebarOpen}
      />
      {isMobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] lg:hidden"
        />
      ) : null}

      <section
        className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ${sidebarOffsetClass}`}
      >
        <Topbar
          staffProfile={staffProfile}
          onMenuToggle={() => setIsMobileSidebarOpen(true)}
          onSidebarToggle={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 xl:px-10">
          {error ? (
            <aside className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </aside>
          ) : null}

          {!isProfileView ? (
            <section className="grid items-start gap-4 lg:gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <section className="min-w-0 space-y-4 lg:space-y-6">
                <HeroBanner
                  eyebrow={viewContent.eyebrow}
                  title={viewContent.title}
                  description={viewContent.description}
                  stats={heroStats}
                />

                {loading ? (
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm text-slate-500">
                      Loading live facility data...
                    </p>
                  </article>
                ) : null}

                {showFacilityOverview && !loading ? (
                  <FacilityOverview
                    facility={facilityProfile}
                    operatingHours={facilityHours}
                    totalCapacity={totalCapacity}
                    totalBookedSlots={totalBookedSlots}
                    fullSlots={fullSlots}
                    pendingTransactions={pendingTransactions}
                  />
                ) : null}

                {showBookingSchedule && !loading ? (
                  <BookingScheduleBoard
                    slots={todaysBookings}
                    selectedDate={selectedDate}
                    onDateChange={changeSelectedDate}
                  />
                ) : null}

                {showTransactionFlow && !loading ? (
                  <TransactionFlowPanel
                    transactions={visibleTransactions}
                    selectedDate={selectedDate}
                    onAdvance={advanceTransaction}
                    actionLoadingId={actionLoadingId}
                    eyebrow={
                      showingConfirmedTransactions
                        ? "Confirmed transactions"
                        : "Transaction flow"
                    }
                    title={
                      showingConfirmedTransactions
                        ? "Archived facility handoffs"
                        : "End-to-end handoff queue"
                    }
                    description={
                      showingConfirmedTransactions
                        ? "Completed and released transactions are grouped here so active staff work stays focused on pending handoffs."
                        : "Staff actions below move a transaction from accepted booking to completed collection, while keeping a visible trail of receipt and release confirmations."
                    }
                    emptyMessage={
                      showingConfirmedTransactions
                        ? "No confirmed transactions are archived for the selected day yet."
                        : "No booked facility transactions are available for staff action yet."
                    }
                  />
                ) : null}
              </section>

              <aside className="min-w-0 h- space-y-2 lg:space-y-6">
                <ActivityFeed activityLog={activityLog} />

              </aside>
            </section>
          ) : (
            <StaffProfileSettings user={staffProfile} />
          )}
        </main>
      </section>
    </section>
  );
}
