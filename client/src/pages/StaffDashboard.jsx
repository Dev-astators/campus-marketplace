import Sidebar from "../components/staff-dashboard/Sidebar";
import Topbar from "../components/staff-dashboard/Topbar";
import HeroBanner from "../components/staff-dashboard/HeroBanner";
import HelpDesk from "../components/staff-dashboard/HelpDesk";
import FacilityOverview from "../components/staff-dashboard/FacilityOverview";
import BookingScheduleBoard from "../components/staff-dashboard/BookingScheduleBoard";
import TransactionFlowPanel from "../components/staff-dashboard/TransactionFlowPanel";
import ActivityFeed from "../components/staff-dashboard/ActivityFeed";
import useStaffDashboard from "../hooks/useStaffDashboard";

export default function StaffDashboard() {
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
    activityLog,
    selectedDate,
    advanceTransaction,
    loading,
    error,
    actionLoadingId,
  } = useStaffDashboard();

  const showFacilityOverview = activeNav === "bookings";
  const showBookingSchedule = activeNav === "bookings" || activeNav === "meetups";
  const showTransactionFlow =
    activeNav === "bookings" || activeNav === "verification";

  return (
    <section className="flex min-h-screen overflow-hidden bg-slate-50  text-slate-900">
      <Sidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />

      <section className="ml-55 flex flex-1 flex-col">
        <Topbar staffProfile={staffProfile} />

        <main className="flex-1 px-6 py-8 md:px-8 xl:px-10">
          {error ? (
            <aside className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </aside>
          ) : null}

          <section className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="space-y-6">
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
                />
              ) : null}

              {showTransactionFlow && !loading ? (
                <TransactionFlowPanel
                  transactions={transactionQueue}
                  onAdvance={advanceTransaction}
                  actionLoadingId={actionLoadingId}
                />
              ) : null}
            </section>

            <aside className="space-y-6">
              <ActivityFeed activityLog={activityLog} />
              <HelpDesk />
            </aside>
          </section>
        </main>
      </section>
    </section>
  );
}
