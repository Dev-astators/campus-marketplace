import { useCallback } from "react";
import AdminSidebar from "../components/adminDashboard/AdminSidebar";
import AdminSummaryCards from "../components/adminDashboard/AdminSummaryCards";
import FacilitySettingsPanel from "../components/adminDashboard/FacilitySettingsPanel";
import ModerationPanel from "../components/adminDashboard/ModerationPanel";
import AnalyticsPanel from "../components/adminDashboard/AnalyticsPanel";
import useAdminDashboard from "../hooks/useAdminDashboard";

export default function AdminDashboard() {
  const {
    navItems,
    activeSection,
    setActiveSection,
    summaryCards,
    facilitySettings,
    operatingHours,
    lastSavedAt,
    updateFacilitySetting,
    updateOperatingHours,
    saveFacilitySettings,
    flaggedListings,
    flaggedReviews,
    resolveListingFlag,
    resolveReviewFlag,
    analytics,
    exportCsv,
    exportPdf,
  } = useAdminDashboard();

  const handleNavigate = useCallback(
    (sectionId) => {
      setActiveSection(sectionId);
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [setActiveSection],
  );

  return (
    <section
      className="h-screen flex flex-col bg-gray-50 overflow-hidden"
      aria-label="Admin dashboard"
    >
      <header className="w-full bg-gray-100 px-6 py-3 flex items-center gap-6 border-b border-gray-200">
        <a
          href="/"
          className="text-2xl font-extrabold text-blue-700 tracking-tight shrink-0"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          UniSquare
        </a>
        <span className="text-sm font-medium text-gray-500">Admin Console</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-medium text-gray-800">Admin</span>
          <figure className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-gray-500"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-7 8a7 7 0 0 1 14 0H5Z"
                clipRule="evenodd"
              />
            </svg>
            <figcaption className="sr-only">Admin profile picture</figcaption>
          </figure>
        </div>
      </header>

      <section
        className="flex flex-1 overflow-hidden"
        aria-label="Dashboard workspace"
      >
        <AdminSidebar
          items={navItems}
          activeItem={activeSection}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
          <section id="overview">
            <h1 className="text-2xl font-bold text-gray-800">Hello, Admin</h1>
            <p className="text-sm text-gray-400">
              Overview of marketplace activity and operations.
            </p>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              type="button"
            >
              Create Report
            </button>
            <button
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              type="button"
            >
              Invite Staff
            </button>
          </div>

          <section className="flex flex-col gap-4">
            <AdminSummaryCards cards={summaryCards} />
          </section>

          <FacilitySettingsPanel
            settings={facilitySettings}
            operatingHours={operatingHours}
            onSettingChange={updateFacilitySetting}
            onHoursChange={updateOperatingHours}
            onSave={saveFacilitySettings}
            lastSavedAt={lastSavedAt}
          />

          <ModerationPanel
            flaggedListings={flaggedListings}
            flaggedReviews={flaggedReviews}
            onResolveListing={resolveListingFlag}
            onResolveReview={resolveReviewFlag}
          />

          <AnalyticsPanel
            analytics={analytics}
            onExportCsv={exportCsv}
            onExportPdf={exportPdf}
          />

          <section
            className="rounded-lg border border-gray-200 bg-white p-6"
            id="settings"
          >
            <header className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Admin Controls
              </h2>
              <p className="text-sm text-gray-500">
                Manage platform-wide preferences and security settings.
              </p>
            </header>
            <div className="mt-5 grid gap-3">
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600"
                  defaultChecked
                />
                <span>Require student email verification</span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600"
                  defaultChecked
                />
                <span>Enable automated pricing suggestions</span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span>Enable cash shortfall reminders</span>
              </label>
            </div>
          </section>
        </main>
      </section>
    </section>
  );
}
