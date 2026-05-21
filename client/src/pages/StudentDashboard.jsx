import { useState, useEffect, useCallback } from "react";
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
import { API_BASE_URL } from "../config/apiBaseUrl";
import { supabase } from "../config/supabaseClient";

const NON_LISTING_TABS = ["my-purchases", "my-sales", "profile", "messages"];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNav, setActiveNav] = useState(
    location.state?.tab || "marketplace",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const { user, listings, loading } = useDashboardListings(activeNav);

  const getStoredBookingReads = useCallback(() => {
    try {
      return JSON.parse(
        localStorage.getItem("read_booking_notifications") || "[]",
      );
    } catch {
      return [];
    }
  }, []);

  const refreshNotificationCount = useCallback(async () => {
    if (!user?.profileId || !user?.id) return;

    let tradeCount = 0;
    let messageCount = 0;
    let bookingCount = 0;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/payments/notifications/${user.profileId}`,
      );
      const data = await res.json();
      tradeCount = Array.isArray(data)
        ? data.filter((notification) => !notification.is_read).length
        : 0;
    } catch {
      tradeCount = 0;
    }

    try {
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      if (error) throw error;
      messageCount = count ?? 0;
    } catch {
      messageCount = 0;
    }

    try {
      const { data, error } = await supabase
        .from("facility_bookings")
        .select("id, booking_type, confirmed_at")
        .eq("student_id", user.id)
        .in("booking_type", ["collection", "drop_off"])
        .order("confirmed_at", { ascending: false });

      if (error) throw error;
      const readIds = getStoredBookingReads();
      bookingCount = (data || []).filter(
        (booking) => !readIds.includes(`booking-${booking.id}`),
      ).length;
    } catch {
      bookingCount = 0;
    }

    setNotificationCount(tradeCount + messageCount + bookingCount);
  }, [user, getStoredBookingReads]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void refreshNotificationCount();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [refreshNotificationCount, activeNav]);

  useEffect(() => {
    if (!user?.profileId || !user?.id) return;

    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        refreshNotificationCount,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        refreshNotificationCount,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.profileId}`,
        },
        refreshNotificationCount,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.profileId}`,
        },
        refreshNotificationCount,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "facility_bookings",
          filter: `student_id=eq.${user.id}`,
        },
        (payload) => {
          if (!payload.new) return;
          if (!["collection", "drop_off"].includes(payload.new.booking_type)) {
            return;
          }
          refreshNotificationCount();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "facility_bookings",
          filter: `student_id=eq.${user.id}`,
        },
        (payload) => {
          if (!payload.new) return;
          if (!["collection", "drop_off"].includes(payload.new.booking_type)) {
            return;
          }
          refreshNotificationCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.profileId, user?.id, refreshNotificationCount]);
  const {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    selectedCondition,
    setSelectedCondition,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    clearFilters,
    filteredListings,
    listingsHeading,
  } = useListingFilters({ listings, activeNav });

  const handleNavigate = (item) => {
    setActiveNav(item);
    setIsSidebarVisible(false);
    if (item === "messages") navigate("/messages");
  };

  const firstName = user?.fullName?.split(" ")[0] || user?.name || "Student";
  const isListingView = !NON_LISTING_TABS.includes(activeNav);
  const isProfileView = activeNav === "profile";
  const isMyListingsView = activeNav === "my-listings";

  const normalizeStatus = (status) => String(status || "active").toLowerCase();
  const activeListings = isMyListingsView
    ? filteredListings.filter(
        (listing) => normalizeStatus(listing.status) === "active",
      )
    : [];
  const reservedListings = isMyListingsView
    ? filteredListings.filter(
        (listing) => normalizeStatus(listing.status) === "reserved",
      )
    : [];
  const otherListings = isMyListingsView
    ? filteredListings.filter(
        (listing) =>
          !["active", "reserved"].includes(normalizeStatus(listing.status)),
      )
    : [];

  const activeFilterCount = [
    selectedCategory !== "All Categories",
    selectedCondition !== "all",
    minPrice !== "",
    maxPrice !== "",
    sortBy !== "newest",
  ].filter(Boolean).length;

  return (
    <main
      className="flex min-h-screen flex-col overflow-hidden bg-gray-50"
      aria-label="Student dashboard"
    >
      <Navbar
        user={user}
        searchValue={search}
        onSearch={setSearch}
        notificationCount={notificationCount}
      />

      <section
        className="flex flex-1 overflow-hidden"
        aria-label="Dashboard workspace"
      >
        <button
          type="button"
          onClick={() => setIsSidebarVisible((current) => !current)}
          className="fixed bottom-4 right-4 z-30 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg md:hidden"
        >
          {isSidebarVisible ? "Close menu" : "Open menu"}
        </button>

        {isSidebarVisible ? (
          <button
            type="button"
            aria-label="Close student navigation"
            onClick={() => setIsSidebarVisible(false)}
            className="fixed inset-0 z-20 bg-slate-900/30 md:hidden"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-30 w-44 bg-white transition-transform md:static md:translate-x-0 ${
            isSidebarVisible ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar activeItem={activeNav} onNavigate={handleNavigate} />
        </aside>

        <section className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <article className="flex flex-col gap-6">
            <header>
              <h1 className="text-2xl font-bold text-gray-800">
                Hello, {firstName}!
              </h1>
              <p className="text-sm text-gray-400">Welcome Back!</p>
            </header>

            {isListingView ? (
              <>
                <button
                  onClick={() => navigate("/create-listing")}
                  className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-white"
                >
                  + Post an Item
                </button>

                <section className="flex flex-col gap-4">
                  <section className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowFilters((current) => !current)}
                      aria-expanded={showFilters}
                      aria-controls="listings-filter-controls"
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 hover:text-gray-900"
                    >
                      {showFilters ? "Hide Filters" : "Show Filters"}
                    </button>

                    {activeFilterCount > 0 ? (
                      <mark className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {activeFilterCount} active
                      </mark>
                    ) : null}
                  </section>

                  {showFilters ? (
                    <section
                      id="listings-filter-controls"
                      className="flex flex-col gap-4"
                    >
                      <CategoryFilter
                        categories={CATEGORIES}
                        selected={selectedCategory}
                        onSelect={setSelectedCategory}
                      />
                      <ListingsFiltersPanel
                        selectedCondition={selectedCondition}
                        onConditionChange={setSelectedCondition}
                        minPrice={minPrice}
                        onMinPriceChange={setMinPrice}
                        maxPrice={maxPrice}
                        onMaxPriceChange={setMaxPrice}
                        sortBy={sortBy}
                        onSortByChange={setSortBy}
                        onClearFilters={clearFilters}
                      />
                    </section>
                  ) : null}
                </section>

                <h2 className="text-lg font-semibold text-gray-700">
                  {listingsHeading}
                </h2>

                {isMyListingsView ? (
                  loading ? (
                    <ListingsGrid listings={[]} loading />
                  ) : (
                    <section
                      className="flex flex-col gap-6"
                      aria-label="My listings sections"
                    >
                      <section className="flex flex-col gap-3">
                        <header className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-600">
                            Active
                          </h3>
                          <small className="text-xs text-gray-400">
                            {activeListings.length}
                          </small>
                        </header>
                        {activeListings.length > 0 ? (
                          <ListingsGrid
                            listings={activeListings}
                            loading={false}
                          />
                        ) : (
                          <p className="text-sm text-gray-400">
                            No active listings yet.
                          </p>
                        )}
                      </section>

                      <section className="flex flex-col gap-3">
                        <header className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-600">
                            Reserved
                          </h3>
                          <small className="text-xs text-gray-400">
                            {reservedListings.length}
                          </small>
                        </header>
                        {reservedListings.length > 0 ? (
                          <ListingsGrid
                            listings={reservedListings}
                            loading={false}
                          />
                        ) : (
                          <p className="text-sm text-gray-400">
                            No reserved listings yet.
                          </p>
                        )}
                      </section>

                      {otherListings.length > 0 ? (
                        <section className="flex flex-col gap-3">
                          <header className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-600">
                              Other
                            </h3>
                            <small className="text-xs text-gray-400">
                              {otherListings.length}
                            </small>
                          </header>
                          <ListingsGrid
                            listings={otherListings}
                            loading={false}
                          />
                        </section>
                      ) : null}
                    </section>
                  )
                ) : (
                  <ListingsGrid listings={filteredListings} loading={loading} />
                )}
              </>
            ) : null}

            {activeNav === "my-purchases" ? (
              <MyPurchases profileId={user?.profileId} />
            ) : null}

            {activeNav === "my-sales" ? (
              <MySales profileId={user?.profileId} />
            ) : null}

            {isProfileView ? <ProfileSettings user={user} /> : null}
          </article>
        </section>
      </section>
    </main>
  );
}
