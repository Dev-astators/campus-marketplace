// src/pages/StudentDashboard.jsx

/**
 * StudentDashboard page
 * Bundles Navbar, Sidebar, CategoryFilter and ListingsGrid.
 *
 * In production, replace MOCK_USER and MOCK_LISTINGS with
 * real data from your Supabase hooks / API calls.
 */

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/studentDashboard/Navbar";
import Sidebar from "../components/studentDashboard/Sidebar";
import CategoryFilter from "../components/studentDashboard/CategoryFilter";
import ListingsGrid from "../components/studentDashboard/ListingsGrid";
import PostNewItemForm from "../components/studentDashboard/PostNewItemForm";
import { supabase } from "../config/supabaseClient";

// ── Mock data (replace with real API data in production) ──────────────────────

const FALLBACK_USER = {
  id: null,
  name: "Nkosinathi Khumalo",
  avatarUrl: null,
};

const CATEGORIES = [
  "All Categories",
  "Textbooks",
  "Electronics",
  "Furniture",
  "Clothing",
  "Other",
];

const MOCK_LISTINGS = [
  {
    id: "1",
    title: "Computer Science Textbook",
    price: 200,
    condition: "Good",
    category: "Textbooks",
    imageUrl: null,
  },
  {
    id: "2",
    title: "Introduction to Algorithms",
    price: 150,
    condition: "Like New",
    category: "Textbooks",
    imageUrl: null,
  },
  {
    id: "3",
    title: 'MacBook Pro 14"',
    price: 12000,
    condition: "Good",
    category: "Electronics",
    imageUrl: null,
  },
  {
    id: "4",
    title: "Wits Hoodie",
    price: 350,
    condition: "New",
    category: "Clothing",
    imageUrl: null,
  },
  {
    id: "5",
    title: "Data Structures Notes",
    price: 80,
    condition: "Fair",
    category: "Textbooks",
    imageUrl: null,
  },
  {
    id: "6",
    title: "Desk Lamp",
    price: 120,
    condition: "Good",
    category: "Furniture",
    imageUrl: null,
  },
  {
    id: "7",
    title: "ASUS VivoBook Laptop",
    price: 7500,
    condition: "Like New",
    category: "Electronics",
    imageUrl: null,
  },
  {
    id: "8",
    title: "Campus Jacket",
    price: 400,
    condition: "New",
    category: "Clothing",
    imageUrl: null,
  },
];

const LISTING_SELECT_COLUMNS =
  "id, title, asking_price, condition, category, listing_type, seller_id, status, created_at";
const LISTING_IMAGE_BUCKET =
  import.meta.env.VITE_LISTING_IMAGES_BUCKET || "listing-images";

function formatConditionLabel(condition) {
  if (!condition || typeof condition !== "string") {
    return "Unknown";
  }

  return condition
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeListing(listing) {
  return {
    id: String(listing.id),
    title: listing.title,
    price: listing.asking_price ?? listing.price ?? 0,
    condition: formatConditionLabel(listing.condition),
    category: listing.category,
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
  const [dashboardUser, setDashboardUser] = useState(FALLBACK_USER);
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // firstName derived from full name for the greeting
  const firstName = dashboardUser.name.split(" ")[0];
  const isPostNewItemTab = activeNav === "post-new-item";

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      const user = authData?.user;
      const userId = user?.id ?? null;

      if (user) {
        setDashboardUser({
          id: userId,
          name:
            user.user_metadata?.full_name || user.email || FALLBACK_USER.name,
          avatarUrl: user.user_metadata?.avatar_url || null,
        });
      } else {
        setDashboardUser(FALLBACK_USER);
      }

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
        window.alert(
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
      dashboardUser.id !== null && dashboardUser.id !== undefined && dashboardUser.id !== "";

    if (activeNav === "my-listings" && !hasDashboardUserId) {
      return [];
    }

    const sourceListings =
      activeNav === "my-listings"
        ? listings.filter((listing) => listing.sellerId === dashboardUser.id)
        : listings.filter(
            (listing) => (listing.status ?? "active") === "active",
          );

    if (selectedCategory === "All Categories") {
      return sourceListings;
    }

    return sourceListings.filter(
      (listing) => listing.category === selectedCategory,
    );
  }, [activeNav, dashboardUser.id, listings, selectedCategory]);

  const handleListingPosted = (postedListing) => {
    setListings((previous) => [
      {
        ...postedListing,
        status: postedListing.status ?? "active",
      },
      ...previous,
    ]);
    setActiveNav("my-listings");
    setSelectedCategory("All Categories");
  };

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
        <Navbar user={dashboardUser} />
      </header>

      {/* Body — sidebar + main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside aria-label="Student navigation">
          <Sidebar
            activeItem={activeNav}
            onNavigate={(nextNav) => {
              handleNavChange(nextNav);
              setSelectedCategory(CATEGORIES[0]);
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
                categories={CATEGORIES.slice(1)}
                onPosted={handleListingPosted}
              />
            </section>
          ) : (
            <>
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
                  categories={CATEGORIES}
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </section>

              {/* Listings grid */}
              <section aria-label="Listings grid">
                <ListingsGrid
                  listings={visibleListings}
                  loading={loadingListings}
                />
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
