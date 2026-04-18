// src/pages/StudentDashboard.jsx

/**
 * StudentDashboard page
 * Bundles Navbar, Sidebar, CategoryFilter and ListingsGrid.
 *
 * Data is loaded from Supabase auth and database tables.
 */

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/studentDashboard/Navbar";
import Sidebar from "../components/studentDashboard/Sidebar";
import CategoryFilter from "../components/studentDashboard/CategoryFilter";
import ListingsGrid from "../components/studentDashboard/ListingsGrid";
import PostNewItemForm from "../components/studentDashboard/PostNewItemForm";
import { supabase } from "../config/supabaseClient";

const LISTING_SELECT_COLUMNS =
  "id, title, asking_price, condition, category, listing_type, seller_id, status, created_at";
const LISTING_IMAGE_BUCKET =
  import.meta.env.VITE_LISTING_IMAGES_BUCKET || "listing-images";
const LISTING_CATEGORIES = [
  "Textbooks",
  "Electronics",
  "Clothing",
  "Furniture",
];
const CATEGORY_FILTER_OPTIONS = ["All Categories", ...LISTING_CATEGORIES];

function formatConditionLabel(condition) {
  if (!condition || typeof condition !== "string") {
    return "Unknown";
  }

  return condition
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCategoryLabel(category) {
  if (!category || typeof category !== "string") {
    return "";
  }

  return category
    .trim()
    .split(/[\s_]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeListing(listing) {
  return {
    id: String(listing.id),
    title: listing.title,
    price: listing.asking_price ?? listing.price ?? 0,
    condition: formatConditionLabel(listing.condition),
    category: formatCategoryLabel(listing.category),
    imageUrl: listing.image_url ?? listing.imageUrl ?? null,
    listingType: listing.listing_type ?? listing.listingType ?? "sale",
    sellerId: listing.seller_id ?? listing.sellerId ?? null,
    status: listing.status ?? "active",
    createdAt: listing.created_at ?? listing.createdAt ?? null,
  };
}

function resolvePublicImageUrl(storagePath) {
  if (!storagePath) {
    return null;
  }

  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }

  const normalizedPath = storagePath.startsWith(`${LISTING_IMAGE_BUCKET}/`)
    ? storagePath.slice(LISTING_IMAGE_BUCKET.length + 1)
    : storagePath;

  const { data } = supabase.storage
    .from(LISTING_IMAGE_BUCKET)
    .getPublicUrl(normalizedPath);

  return data?.publicUrl ?? null;
}

function mergeListingRows(activeRows = [], ownRows = []) {
  const byId = new Map();

  [...activeRows, ...ownRows].forEach((row) => {
    const normalized = normalizeListing(row);
    byId.set(normalized.id, normalized);
  });

  return Array.from(byId.values()).sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

async function attachPrimaryImages(listingRows = []) {
  if (listingRows.length === 0) {
    return listingRows;
  }

  const listingIds = listingRows.map((listing) => listing.id);

  const { data: imageRows, error } = await supabase
    .from("listing_images")
    .select("listing_id, storage_path, display_order")
    .in("listing_id", listingIds)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Failed to load listing images:", error.message);
    return listingRows;
  }

  const primaryImageByListingId = new Map();
  (imageRows || []).forEach((imageRow) => {
    const listingId = String(imageRow.listing_id);
    if (primaryImageByListingId.has(listingId)) {
      return;
    }

    primaryImageByListingId.set(
      listingId,
      resolvePublicImageUrl(imageRow.storage_path),
    );
  });

  return listingRows.map((listing) => ({
    ...listing,
    imageUrl:
      primaryImageByListingId.get(String(listing.id)) ??
      listing.imageUrl ??
      null,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const [activeNav, setActiveNav] = useState("marketplace");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [dashboardUser, setDashboardUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  // firstName derived from full name for the greeting
  const firstName = (dashboardUser?.name || "Student").split(" ")[0];
  const isPostNewItemTab = activeNav === "post-new-item";
  const effectiveSelectedCategory = CATEGORY_FILTER_OPTIONS.includes(
    selectedCategory,
  )
    ? selectedCategory
    : "All Categories";

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setDashboardError("");

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (authError) {
        setDashboardUser(null);
        setListings([]);
        setLoadingListings(false);
        setDashboardError(
          "Unable to verify your session. Please sign in again.",
        );
        return;
      }

      const user = authData?.user;

      if (!user?.id) {
        setDashboardUser(null);
        setListings([]);
        setLoadingListings(false);
        setDashboardError("Please sign in to view your dashboard.");
        return;
      }

      const userId = user.id;
      setDashboardUser({
        id: userId,
        name: user.user_metadata?.full_name || user.email || "Student",
        avatarUrl: user.user_metadata?.avatar_url || null,
      });

      const activeListingsRequest = supabase
        .from("listings")
        .select(LISTING_SELECT_COLUMNS)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      const ownListingsRequest = userId
        ? supabase
            .from("listings")
            .select(LISTING_SELECT_COLUMNS)
            .eq("seller_id", userId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null });

      const [activeResult, ownResult] = await Promise.all([
        activeListingsRequest,
        ownListingsRequest,
      ]);

      const activeRows = activeResult.data || [];
      const ownRows = ownResult.data || [];

      if (!isMounted) {
        return;
      }

      if (activeResult.error) {
        console.error(
          "Failed to load marketplace listings:",
          activeResult.error.message,
        );
      }

      if (ownResult.error) {
        console.error("Failed to load my listings:", ownResult.error.message);
      }

      if (activeResult.error && ownResult.error) {
        setListings([]);
        setLoadingListings(false);
        setDashboardError(
          "Unable to load listings right now. Please check your connection and try again later.",
        );
        return;
      } else {
        const mergedListings = mergeListingRows(activeRows, ownRows);
        const listingsWithImages = await attachPrimaryImages(mergedListings);

        if (!isMounted) {
          return;
        }

        setListings(listingsWithImages);
        if (activeResult.error || ownResult.error) {
          setDashboardError(
            "Some dashboard data could not be loaded. You may see partial results.",
          );
        }
      }

      setLoadingListings(false);
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleListings = useMemo(() => {
    const hasDashboardUserId =
      dashboardUser?.id !== null &&
      dashboardUser?.id !== undefined &&
      dashboardUser?.id !== "";

    if (activeNav === "my-listings" && !hasDashboardUserId) {
      return [];
    }

    const sourceListings =
      activeNav === "my-listings"
        ? listings.filter((listing) => listing.sellerId === dashboardUser?.id)
        : listings.filter(
            (listing) => (listing.status ?? "active") === "active",
          );

    if (effectiveSelectedCategory === "All Categories") {
      return sourceListings;
    }

    return sourceListings.filter(
      (listing) => listing.category === effectiveSelectedCategory,
    );
  }, [activeNav, dashboardUser?.id, listings, effectiveSelectedCategory]);

  const handleListingPosted = (postedListing) => {
    const nextListing = {
      ...postedListing,
      category: formatCategoryLabel(postedListing.category),
      status: postedListing.status ?? "active",
      sellerId: postedListing.sellerId ?? dashboardUser?.id ?? null,
    };

    setListings((previous) => [nextListing, ...previous]);
    setActiveNav("my-listings");
    setSelectedCategory("All Categories");
  };

  const emptyStateMessage =
    activeNav === "my-listings"
      ? effectiveSelectedCategory === "All Categories"
        ? "You have no listings available right now."
        : `You have no ${effectiveSelectedCategory} listings available right now.`
      : effectiveSelectedCategory === "All Categories"
        ? "No listings available right now."
        : `${effectiveSelectedCategory} listings are not available right now.`;

  const handleNavChange = (nextNav) => {
    setActiveNav(nextNav);

    if (nextNav === "marketplace" || nextNav === "my-listings") {
      setSelectedCategory("All Categories");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gray-50"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Top navbar — full width */}
      <header>
        <Navbar user={dashboardUser || { name: "Student", avatarUrl: null }} />
      </header>

      {/* Body — sidebar + main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside aria-label="Student navigation">
          <Sidebar
            activeItem={activeNav}
            onNavigate={(nextNav) => {
              handleNavChange(nextNav);
              setSelectedCategory("All Categories");
            }}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
          {isPostNewItemTab ? (
            <section
              id="post-new-item"
              aria-label="Post new item section"
              className="max-w-2xl"
            >
              <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  Post New Item
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Creating listing as {dashboardUser.name}
                </p>
              </header>

              <PostNewItemForm
                user={dashboardUser}
                categories={LISTING_CATEGORIES}
                onPosted={handleListingPosted}
              />
            </section>
          ) : (
            <>
              {dashboardError ? (
                <section
                  aria-label="Dashboard message"
                  className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  role="alert"
                >
                  {dashboardError}
                </section>
              ) : null}

              {/* Greeting */}
              <header aria-label="Welcome message">
                <h1 className="text-2xl font-bold text-gray-800">
                  Hello, {firstName}
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">Welcome Back!</p>
              </header>

              {/* Category filter */}
              <section aria-label="Category filter">
                <CategoryFilter
                  categories={CATEGORY_FILTER_OPTIONS}
                  selected={effectiveSelectedCategory}
                  onSelect={setSelectedCategory}
                />
              </section>

              {/* Listings grid */}
              <section aria-label="Listings grid">
                <ListingsGrid
                  listings={visibleListings}
                  loading={loadingListings}
                  emptyMessage={emptyStateMessage}
                />
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
