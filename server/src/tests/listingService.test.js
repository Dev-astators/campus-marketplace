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

// Build a chainable mock that returns promises at terminal methods
const createChainable = () => {
  const obj = {
    select: (...args) => { 
      mockSelect(...args); 
      return obj; 
    },
    eq: (...args) => { 
      mockEq(...args);     
      return obj; 
    },
    order: (...args) => { 
      mockOrder(...args);  
      return obj; 
    },
    insert: (...args) => { 
      mockInsert(...args); 
      return obj; 
    },
    single: (...args) => mockSingle(...args),
  };
  return obj;
};

jest.mock("../config/supabaseClient", () => ({
  supabase: {
    from: (...args) => {
      mockFrom(...args);
      return createChainable();
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
// getPublicSellerProfile
// ─────────────────────────────────────────────────────────────────────────────
describe("getPublicSellerProfile", () => {
  it("returns seller profile and their listings", async () => {
    mockSingle.mockResolvedValue({ data: SELLER_PROFILE, error: null });
    mockOrder.mockResolvedValue({ data: [LISTING_A], error: null });

    const result = await getPublicSellerProfile("seller-1");

    expect(result.error).toBeNull();
    expect(result.data.seller).toEqual(SELLER_PROFILE);
    // expect(result.data.listings).toHaveLength(1);
    // expect(result.data.listings[0].id).toBe("listing-1");
  });

  it("returns empty listings array when seller has no active listings", async () => {
    mockSingle.mockResolvedValue({ data: SELLER_PROFILE, error: null });
    mockOrder.mockResolvedValue({ data: [], error: null });

    const result = await getPublicSellerProfile("seller-1");

    expect(result.error).toBeNull();
    expect(result.data.listings).toEqual([]);
    expect(result.data.seller).toEqual(SELLER_PROFILE);
  });

  it("returns error when seller profile is not found", async () => {
    const profileError = new Error("Row not found");
    mockSingle.mockResolvedValue({ data: null, error: profileError });

    const result = await getPublicSellerProfile("unknown-seller");

    expect(result.data).toBeNull();
    expect(result.error).toBe(profileError);
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

  const createdListing = { 
    id: "listing-new", 
    seller_id: "seller-1",
    title: "Laptop",
    description: "Barely used",
    category: "electronics",
    condition: "like_new",
    price: 5000,
    listing_type: "sale",
    status: "active" 
  };

  it("creates a listing with no images", async () => {
    mockSingle.mockResolvedValue({ data: createdListing, error: null });

    const result = await createListing(baseInput);

    expect(result.error).toBeNull();
    expect(result.data).toEqual(createdListing);
    expect(mockFrom).toHaveBeenCalledWith("listings");
    // listing_images.insert should NOT have been called
    expect(mockFrom).not.toHaveBeenCalledWith("listing_images");
  });

  it("creates a listing and inserts images when provided", async () => {
    const images = ["bucket/a.jpg", "bucket/b.jpg"];
    
    // First call for listing insertion
    mockSingle.mockResolvedValueOnce({ data: createdListing, error: null });
    // Second call for image insertion
    mockInsert.mockResolvedValueOnce({ error: null });

    const result = await createListing({ ...baseInput, images });

    expect(result.error).toBeNull();
    expect(result.data).toEqual(createdListing);
    expect(mockFrom).toHaveBeenCalledWith("listing_images");
    expect(mockInsert).toHaveBeenCalled();
  });

  it("returns error when the listing insert fails", async () => {
    const dbError = new Error("unique constraint");
    mockSingle.mockResolvedValue({ data: null, error: dbError });

    const result = await createListing(baseInput);

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });


  it("defaults images to empty array when omitted", async () => {
    mockSingle.mockResolvedValue({ data: createdListing, error: null });

    const result = await createListing(baseInput);

    expect(result.error).toBeNull();
    expect(result.data).toEqual(createdListing);
    const fromCalls = mockFrom.mock.calls.map((c) => c[0]);
    expect(fromCalls).not.toContain("listing_images");
  });
});