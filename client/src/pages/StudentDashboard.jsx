// src/pages/StudentDashboard.jsx

import { useState } from "react";
import Navbar from "../components/studentDashboard/Navbar";
import Sidebar from "../components/studentDashboard/Sidebar";
import CategoryFilter from "../components/studentDashboard/CategoryFilter";
import ListingsGrid from "../components/studentDashboard/ListingsGrid";
import ListingsFiltersPanel from "../components/studentDashboard/ListingsFiltersPanel";
import { CATEGORIES } from "../components/studentDashboard/listingFiltersConfig";
import useDashboardListings from "../hooks/useDashboardListings";
import useListingFilters from "../hooks/useListingFilters";
import { useNavigate } from "react-router-dom";
import ProfileSettings from "../components/studentDashboard/ProfileSettings";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState("marketplace");

  // The dashboard page now acts as an orchestrator: hooks manage state/data,
  // while child components handle presentation.
  const { user, listings, loading } = useDashboardListings(activeNav);
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

  // Keep local tab navigation in-page, but route to dedicated pages where needed.
  const handleNavigate = (item) => {
    setActiveNav(item);

    if (item === "messages") {
      navigate("/messages"); // ✅ THIS MAKES IT WORK
    }
  };

  const firstName =
    user?.fullName?.split(" ")[0] || user?.email?.split("@")[0] || "Student";

  return (
    <section
      className="h-screen flex flex-col bg-gray-50 overflow-hidden"
      aria-label="Student dashboard"
    >
      <Navbar user={user} searchValue={search} onSearch={setSearch} />

      <section
        className="flex flex-1 overflow-hidden"
        aria-label="Dashboard workspace"
      >
        <Sidebar activeItem={activeNav} onNavigate={handleNavigate} />

        <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
          <section>
            <h1 className="text-2xl font-bold text-gray-800">
              Hello, {firstName}
            </h1>
            <p className="text-sm text-gray-400">Welcome Back!</p>
          </section>

          <button
            onClick={() => navigate("/create-listing")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg w-fit"
          >
            + Create Listing
          </button>

          {activeNav === "profile" ? (
            <ProfileSettings user={user} />
          ) : (
            <>
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

              <section aria-label="Listings">
                <h2 className="text-lg font-semibold text-gray-700">
                  {listingsHeading}
                </h2>

                <ListingsGrid listings={filteredListings} loading={loading} />
              </section>
            </>
          )}
        </main>
      </section>
    </section>
  );
}
