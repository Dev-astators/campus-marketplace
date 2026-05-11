// src/pages/StudentDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/studentDashboard/Navbar";
import Sidebar from "../components/studentDashboard/Sidebar";
import CategoryFilter from "../components/studentDashboard/CategoryFilter";
import ListingsGrid from "../components/studentDashboard/ListingsGrid";
import ListingsFiltersPanel from "../components/studentDashboard/ListingsFiltersPanel";
import { CATEGORIES } from "../components/studentDashboard/listingFiltersConfig";
import useDashboardListings from "../hooks/useDashboardListings";
import useListingFilters from "../hooks/useListingFilters";
import ProfileSettings from "../components/studentDashboard/ProfileSettings";
import MyPurchases from "../components/studentDashboard/MyPurchases";
import MySales from "../components/studentDashboard/MySales";
import InAppNotifications from "../components/studentDashboard/InAppNotifications";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Tabs that don't use the marketplace listings feed at all
const NON_LISTING_TABS = ["my-purchases", "my-sales", "notifications", "profile", "messages"];

export default function StudentDashboard() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Support navigating directly to a tab via router state (e.g. from notifications click)
  const [activeNav, setActiveNav] = useState(
    location.state?.tab || "marketplace"
  );
  const [showFilters, setShowFilters] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, listings, loading } = useDashboardListings(activeNav);

  const {
    search, setSearch,
    selectedCategory, setSelectedCategory,
    selectedCondition, setSelectedCondition,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    sortBy, setSortBy,
    clearFilters,
    filteredListings,
    listingsHeading,
  } = useListingFilters({ listings, activeNav });

  // Fetch unread notification count for the sidebar badge
  useEffect(() => {
    if (!user?.profileId) return;

    const fetchUnread = async () => {
      try {
        const res  = await fetch(`${API_URL}/api/payments/notifications/${user.profileId}`);
        const data = await res.json();
        const count = Array.isArray(data) ? data.filter(n => !n.is_read).length : 0;
        setUnreadCount(count);
      } catch {
        // silently fail — badge just won't show
      }
    };

    fetchUnread();
  }, [user?.profileId, activeNav]); // re-fetch when switching tabs

  const handleNavigate = (item) => {
    setActiveNav(item);
    if (item === "messages") navigate("/messages");
  };

  const firstName      = user?.fullName?.split(" ")[0] || user?.name || "Student";
  const isListingView  = !NON_LISTING_TABS.includes(activeNav);
  const isProfileView  = activeNav === "profile";

  const activeFilterCount = [
    selectedCategory !== "All Categories",
    selectedCondition !== "all",
    minPrice !== "",
    maxPrice !== "",
    sortBy !== "newest",
  ].filter(Boolean).length;

  return (
    <section className="h-screen flex flex-col bg-gray-50 overflow-hidden" aria-label="Student dashboard">
      <Navbar user={user} searchValue={search} onSearch={setSearch} />

      <section className="flex flex-1 overflow-hidden" aria-label="Dashboard workspace">
        <Sidebar
          activeItem={activeNav}
          onNavigate={handleNavigate}
          unreadCount={unreadCount}
        />

        <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-800">Hello, {firstName}!</h1>
            <p className="text-sm text-gray-400">Welcome Back!</p>
          </header>

          {/* ── Marketplace + My Listings ── */}
          {isListingView && (
            <>
              <button
                onClick={() => navigate("/create-listing")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg w-fit cursor-pointer"
              >
                + Create Listing
              </button>

              <section className="flex flex-col gap-4">
                <section className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFilters(c => !c)}
                    aria-expanded={showFilters}
                    aria-controls="listings-filter-controls"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 hover:text-gray-900 cursor-pointer"
                  >
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </button>

                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {activeFilterCount} active
                    </span>
                  )}
                </section>

                {showFilters && (
                  <section id="listings-filter-controls" className="flex flex-col gap-4">
                    <CategoryFilter categories={CATEGORIES} selected={selectedCategory} onSelect={setSelectedCategory} />
                    <ListingsFiltersPanel
                      selectedCondition={selectedCondition} onConditionChange={setSelectedCondition}
                      minPrice={minPrice} onMinPriceChange={setMinPrice}
                      maxPrice={maxPrice} onMaxPriceChange={setMaxPrice}
                      sortBy={sortBy} onSortByChange={setSortBy}
                      onClearFilters={clearFilters}
                    />
                  </section>
                )}
              </section>

              <h2 className="text-lg font-semibold text-gray-700">{listingsHeading}</h2>
              <ListingsGrid listings={filteredListings} loading={loading} />
            </>
          )}

          {/* ── My Purchases ── */}
          {activeNav === "my-purchases" && (
            <MyPurchases profileId={user?.profileId} />
          )}

          {/* ── My Sales ── */}
          {activeNav === "my-sales" && (
            <MySales profileId={user?.profileId} />
          )}

          {/* ── Notifications ── */}
          {activeNav === "notifications" && (
            <InAppNotifications profileId={user?.profileId} />
          )}

          {/* ── Profile ── */}
          {isProfileView && <ProfileSettings user={user} />}
        </main>
      </section>
    </section>
  );
}
