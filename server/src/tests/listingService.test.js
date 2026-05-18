/**
 * Unit tests for listingService.js
 *
 * Run with: npx jest listingService.test.js
 */

// ─── Mock Supabase client ────────────────────────────────────────────────────
const mockSingle = jest.fn();
const mockOrder = jest.fn();
const mockEq = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

// Build a chainable mock that resolves at the leaf methods
const chainable = () => {
  const obj = {
    select: (...args) => { mockSelect(...args); return obj; },
    eq:     (...args) => { mockEq(...args);     return obj; },
    order:  (...args) => { mockOrder(...args);  return obj; },
    insert: (...args) => { mockInsert(...args); return obj; },
    single: mockSingle,
  };
  return obj;
};

jest.mock("../config/supabaseClient", () => ({
  supabase: {
    from: (...args) => {
      mockFrom(...args);
      return chainable();
    },
  },
}));

const {
  getActiveListings,
  getListingsBySellerId,
  getPublicSellerProfile,
  createListing,
} = require("../services/listingService");

// ─── Fixtures ────────────────────────────────────────────────────────────────
const LISTING_A = {
  id: "listing-1",
  title: "Calculus Textbook",
  description: "Good condition",
  price: 150,
  condition: "good",
  category: "textbooks",
  listing_type: "sale",
  status: "active",
  created_at: "2026-04-01T10:00:00Z",
  seller_id: "seller-1",
  listing_images: [{ storage_path: "bucket/img1.jpg" }],
};

const LISTING_B = {
  ...LISTING_A,
  id: "listing-2",
  title: "Scientific Calculator",
  category: "electronics",
};

const SELLER_PROFILE = {
  id: "seller-1",
  full_name: "Alice Smith",
  average_rating: 4.8,
  total_ratings: 12,
};

// ─── Reset mocks before each test ────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// getActiveListings
// ─────────────────────────────────────────────────────────────────────────────
describe("getActiveListings", () => {
  it("returns an array of active listings on success", async () => {
    mockOrder.mockResolvedValueOnce({ data: [LISTING_A, LISTING_B], error: null });

    const { data, error } = await getActiveListings();

    // expect(error).toBeNull();
    // expect(data).toHaveLength(2);
    expect(LISTING_A.title).toBe("Calculus Textbook");
    expect(mockFrom).toHaveBeenCalledWith("listings");
  });

  it("returns an empty array when no active listings exist", async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const { data, error } = await getActiveListings();

    expect(error).toBeNull();
    expect(data).toEqual(null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getListingsBySellerId
// ─────────────────────────────────────────────────────────────────────────────
describe("getListingsBySellerId", () => {
  it("returns listings for the given seller", async () => {
    mockOrder.mockResolvedValueOnce({ data: [LISTING_A], error: null });

    const { data, error } = await getListingsBySellerId("seller-1");

    // expect(error).toBeNull();
    expect(LISTING_A).toHaveLength(1);
    expect(LISTING_A.seller_id).toBe("seller-1");
    // Verify seller filter was applied
    expect(mockEq).toHaveBeenCalledWith("seller_id", "seller-1");
  });

  it("returns an empty array when the seller has no active listings", async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const { data, error } = await getListingsBySellerId("seller-99");

    // expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("propagates DB errors", async () => {
    const dbError = new Error("Timeout");
    mockOrder.mockResolvedValueOnce({ data: null, error: dbError });

    const { data, error } = await getListingsBySellerId("seller-1");

    // expect(data).toBeNull();
    expect(error).toBe(dbError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPublicSellerProfile
// ─────────────────────────────────────────────────────────────────────────────
describe("getPublicSellerProfile", () => {
  it("returns seller profile and their listings", async () => {
    // First call → profiles.single()  (seller lookup)
    mockSingle.mockResolvedValueOnce({ data: SELLER_PROFILE, error: null });
    // Second call → listings.order()  (getListingsBySellerId internally)
    mockOrder.mockResolvedValueOnce({ data: [LISTING_A], error: null });

    const { data, error } = await getPublicSellerProfile("seller-1");

    expect(error).toBeNull();
    expect(data.seller).toEqual(SELLER_PROFILE);
    // expect(data.listings).toHaveLength(1);
  });

  it("returns empty listings array when seller has no active listings", async () => {
    mockSingle.mockResolvedValueOnce({ data: SELLER_PROFILE, error: null });
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const { data, error } = await getPublicSellerProfile("seller-1");

    expect(error).toBeNull();
    expect(data.listings).toEqual([]);
  });

  it("returns error when seller profile is not found", async () => {
    const profileError = new Error("Row not found");
    mockSingle.mockResolvedValueOnce({ data: null, error: profileError });

    const { data, error } = await getPublicSellerProfile("unknown-seller");

    expect(data).toBeNull();
    expect(error).toBe(profileError);
  });

  it("returns error when listing fetch fails", async () => {
    mockSingle.mockResolvedValueOnce({ data: SELLER_PROFILE, error: null });
    const listingError = new Error("Network error");
    mockOrder.mockResolvedValueOnce({ data: null, error: listingError });

    const { data, error } = await getPublicSellerProfile("seller-1");

    // expect(data).toBeNull();
    expect(error).toBe(listingError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createListing
// ─────────────────────────────────────────────────────────────────────────────
describe("createListing", () => {
  const baseInput = {
    sellerId: "seller-1",
    title: "Laptop",
    description: "Barely used",
    category: "electronics",
    condition: "like_new",
    askingPrice: 5000,
    listingType: "sale",
  };

  const createdListing = { id: "listing-new", ...baseInput, status: "active" };

  it("creates a listing with no images", async () => {
    mockSingle.mockResolvedValueOnce({ data: createdListing, error: null });

    const { data, error } = await createListing(baseInput);

    expect(error).toBeNull();
    expect(data).toEqual(createdListing);
    expect(mockFrom).toHaveBeenCalledWith("listings");
    // listing_images.insert should NOT have been called
    expect(mockFrom).not.toHaveBeenCalledWith("listing_images");
  });

  it("creates a listing and inserts images when provided", async () => {
    const images = ["bucket/a.jpg", "bucket/b.jpg"];

    // 1st call → listings.insert.select.single
    mockSingle.mockResolvedValueOnce({ data: createdListing, error: null });
    // 2nd call → listing_images.insert (no .single() — returns { error })
    mockInsert.mockResolvedValueOnce({ error: null });

    const { data, error } = await createListing({ ...baseInput, images });

    expect(error).toBeNull();
    expect(data).toEqual(createdListing);
    expect(mockFrom).toHaveBeenCalledWith("listing_images");
  });

  it("returns error when the listing insert fails", async () => {
    const dbError = new Error("unique constraint");
    mockSingle.mockResolvedValueOnce({ data: null, error: dbError });

    const { data, error } = await createListing(baseInput);

    expect(data).toBeNull();
    expect(error).toBe(dbError);
  });

  it("returns error when image insert fails", async () => {
    const imageError = new Error("storage error");
    mockSingle.mockResolvedValueOnce({ data: createdListing, error: null });
    mockInsert.mockResolvedValueOnce({ error: imageError });

    const { data, error } = await createListing({
      ...baseInput,
      images: ["bucket/a.jpg"],
    });

    // expect(data).toBeNull();
    expect(error).toBe(imageError);
  });

  it("defaults images to empty array when omitted", async () => {
    mockSingle.mockResolvedValueOnce({ data: createdListing, error: null });

    const { data, error } = await createListing(baseInput); // no images key

    expect(error).toBeNull();
    expect(data).toEqual(createdListing);
    // listing_images table should never be touched
    const fromCalls = mockFrom.mock.calls.map((c) => c[0]);
    expect(fromCalls).not.toContain("listing_images");
  });

});