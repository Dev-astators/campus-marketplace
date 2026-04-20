// Shared listing filter options used by dashboard components.
// Keeping these centralized avoids drift between filter UI and filter logic.
export const CATEGORIES = [
  "All Categories",
  "Textbooks",
  "Electronics",
  "Furniture",
  "Clothing",
];

export const CONDITIONS = [
  { value: "all", label: "All Conditions" },
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_low_high", label: "Price: Low to High" },
  { value: "price_high_low", label: "Price: High to Low" },
  { value: "title_az", label: "Title: A to Z" },
];
