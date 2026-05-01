import { useMemo, useState } from "react";

const DEFAULT_CATEGORY = "All Categories";
const DEFAULT_CONDITION = "all";
const DEFAULT_SORT = "newest";

// Centralized state + derived data for all listing filter controls.
export default function useListingFilters({ listings, activeNav }) {
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);
  const [selectedCondition, setSelectedCondition] = useState(DEFAULT_CONDITION);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);
  const [search, setSearch] = useState("");

  // Filtering pipeline order:
  // keyword -> category -> condition -> price range -> sorting.
  // useMemo keeps this computation stable between unrelated renders.
  const filteredListings = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const hasMinPrice = minPrice !== "";
    const hasMaxPrice = maxPrice !== "";
    const min = hasMinPrice ? Number(minPrice) : null;
    const max = hasMaxPrice ? Number(maxPrice) : null;

    return [...listings]
      .filter((listing) => {
        if (!keyword) return true;

        const title = listing.title?.toLowerCase() || "";
        const description = listing.description?.toLowerCase() || "";
        const category = listing.category?.toLowerCase() || "";
        const condition = listing.condition?.toLowerCase() || "";

        return (
          title.includes(keyword) ||
          description.includes(keyword) ||
          category.includes(keyword) ||
          condition.includes(keyword)
        );
      })
      .filter(
        (listing) =>
          selectedCategory === DEFAULT_CATEGORY ||
          listing.category === selectedCategory,
      )
      .filter(
        (listing) =>
          selectedCondition === DEFAULT_CONDITION ||
          listing.condition === selectedCondition,
      )
      .filter((listing) => {
        const price = Number(listing.price);
        if (!Number.isFinite(price)) return false;

        if (hasMinPrice && Number.isFinite(min) && price < min) return false;
        if (hasMaxPrice && Number.isFinite(max) && price > max) return false;

        return true;
      })
      .sort((a, b) => {
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        const titleA = a.title || "";
        const titleB = b.title || "";
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

        switch (sortBy) {
          case "oldest":
            return dateA - dateB;
          case "price_low_high":
            return priceA - priceB;
          case "price_high_low":
            return priceB - priceA;
          case "title_az":
            return titleA.localeCompare(titleB);
          case "newest":
          default:
            return dateB - dateA;
        }
      });
  }, [
    listings,
    search,
    selectedCategory,
    selectedCondition,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  const listingsHeading =
    activeNav === "my-listings" ? "My Listings" : "Marketplace Listings";

  // Reset every control back to the shared defaults.
  const clearFilters = () => {
    setSelectedCategory(DEFAULT_CATEGORY);
    setSelectedCondition(DEFAULT_CONDITION);
    setMinPrice("");
    setMaxPrice("");
    setSortBy(DEFAULT_SORT);
    setSearch("");
  };

  return {
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
  };
}
