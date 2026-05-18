import { useCallback } from "react";
import AdminSidebar from "../components/adminDashboard/AdminSidebar";
import AdminSummaryCards from "../components/adminDashboard/AdminSummaryCards";
import FacilitySettingsPanel from "../components/adminDashboard/FacilitySettingsPanel";
import ModerationPanel from "../components/adminDashboard/ModerationPanel";
import AnalyticsPanel from "../components/adminDashboard/AnalyticsPanel";
import UserManagement from "../components/adminDashboard/UserManagement";
import AdminProfileSettings from "../components/adminDashboard/AdminProfileSettings";
import useAdminDashboard from "../hooks/useAdminDashboard";

export default function AdminDashboard() {
  const {
    navItems,
    activeSection,
    setActiveSection,
    user,
    summaryCards,
    facilities,
    selectedFacilityId,
    facilitySettings,
    operatingHours,
    lastSavedAt,
    savingFacility,
    updateFacilitySetting,
    updateOperatingHours,
    saveFacilitySettings,
    selectFacility,
    flaggedListings,
    flaggedReviews,
    resolveListingFlag,
    resolveReviewFlag,
    analytics,
    exportCsv,
    exportPdf,
    users,
    togglingRole,
    updateUserRole,
    loadingStates,
    errors = {},
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

  const firstName = user?.fullName?.split(" ")[0] || user?.name || "Admin";

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-gray-50" aria-label="Admin dashboard">
      <header className="w-full border-b border-gray-200 bg-gray-100 px-4 py-3 sm:px-6">
        <section className="flex flex-wrap items-center gap-3 sm:gap-6">
          <a
            href="/"
            className="shrink-0 text-2xl font-extrabold tracking-tight text-blue-700"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            UniSquare
          </a>
          <p className="text-sm font-medium text-gray-500">Admin Console</p>
          <section className="ml-auto flex items-center gap-3">
            <p className="hidden text-sm font-medium text-gray-800 sm:block">
              {user?.fullName}
            </p>
            <figure className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gray-300">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user?.fullName} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6 text-gray-500"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-7 8a7 7 0 0 1 14 0H5Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <figcaption className="sr-only">Admin profile picture</figcaption>
            </figure>
          </section>
        </section>
      </header>

      <section className="flex flex-1 overflow-hidden" aria-label="Dashboard workspace">
        <aside className="hidden w-44 shrink-0 md:block">
          <AdminSidebar
            items={navItems}
            activeItem={activeSection}
            onNavigate={handleNavigate}
          />
        </aside>

        <section className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <article className="flex flex-col gap-6">
            {activeSection === "profile" ? (
              <section id="profile">
                <h1 className="mb-4 text-2xl font-bold text-gray-800">Profile</h1>
                <AdminProfileSettings user={user} />
              </section>
            ) : null}

            {activeSection !== "profile" ? (
              <section id="overview">
                <h1 className="text-2xl font-bold text-gray-800">Hello, {firstName}</h1>
                <p className="text-sm text-gray-400">
                  Overview of marketplace activity and operations.
                </p>
              </section>
            ) : null}

            {activeSection !== "profile" ? (
              <>
                {Object.entries(errors).some(([, message]) => !!message) ? (
                  <aside className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <strong>Some data failed to load:</strong>{" "}
                    {Object.entries(errors)
                      .filter(([, message]) => !!message)
                      .map(([key, message]) => `${key}: ${message}`)
                      .join(" · ")}
                  </aside>
                ) : null}

                <section className="flex flex-col gap-4">
                  {loadingStates.summary ? (
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <article
                          key={index}
                          className="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
                        />
                      ))}
                    </section>
                  ) : (
                    <AdminSummaryCards cards={summaryCards} />
                  )}
                </section>

                {facilities.length > 1 ? (
                  <section className="flex flex-col gap-3 sm:flex-row sm:items-center" id="facility-selector">
                    <label
                      className="text-sm font-medium text-gray-600"
                      htmlFor="facility-select"
                    >
                      Editing facility:
                    </label>
                    <select
                      id="facility-select"
                      value={selectedFacilityId ?? ""}
                      onChange={(event) => selectFacility(event.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      {facilities.map((facility) => (
                        <option key={facility.id} value={facility.id}>
                          {facility.name} — {facility.location}
                        </option>
                      ))}
                    </select>
                  </section>
                ) : null}

                <FacilitySettingsPanel
                  settings={facilitySettings}
                  operatingHours={operatingHours}
                  onSettingChange={updateFacilitySetting}
                  onHoursChange={updateOperatingHours}
                  onSave={saveFacilitySettings}
                  lastSavedAt={lastSavedAt}
                  isSaving={savingFacility}
                  isNew={!selectedFacilityId}
                />

                {loadingStates.moderation ? (
                  <article className="h-40 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
                ) : (
                  <ModerationPanel
                    flaggedListings={flaggedListings}
                    flaggedReviews={flaggedReviews}
                    onResolveListing={resolveListingFlag}
                    onResolveReview={resolveReviewFlag}
                  />
                )}

                {loadingStates.analytics ? (
                  <article className="h-64 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
                ) : (
                  <AnalyticsPanel
                    analytics={analytics}
                    onExportCsv={exportCsv}
                    onExportPdf={exportPdf}
                  />
                )}

                {loadingStates.users ? (
                  <article className="h-64 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
                ) : (
                  <UserManagement
                    users={users}
                    facilities={facilities}
                    togglingRole={togglingRole}
                    onRoleChange={updateUserRole}
                  />
                )}

                <section className="rounded-lg border border-gray-200 bg-white p-6" id="settings">
                  <header className="flex flex-col gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Platform Settings
                    </h2>
                    <p className="text-sm text-gray-500">
                      Manage platform-wide preferences and security settings.
                    </p>
                  </header>

                  <section className="mt-5 grid gap-3">
                    <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600"
                        defaultChecked
                      />
                      <p>Require student email verification</p>
                    </label>
                    <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600"
                        defaultChecked
                      />
                      <p>Enable automated pricing suggestions</p>
                    </label>
                    <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                      <input type="checkbox" className="h-4 w-4 text-blue-600" />
                      <p>Enable cash shortfall reminders</p>
                    </label>
                  </section>
                </section>
              </>
            ) : null}
          </article>
        </section>
      </section>
    </main>
  );
}
