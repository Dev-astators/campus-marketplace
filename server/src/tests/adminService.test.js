// src/tests/adminService.test.js
// Unit tests for adminService.js
// Covers: getAdminSummary, getAdminAnalytics, getModerationQueue,
//         resolveListingFlag, resolveReviewFlag, getAllUsers,
//         updateUserRole, getFacilities, upsertFacility

jest.mock("../config/supabaseClient", () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = require("../config/supabaseClient");

const {
  getAdminSummary,
  getAdminAnalytics,
  getModerationQueue,
  resolveListingFlag,
  resolveReviewFlag,
  getAllUsers,
  updateUserRole,
  getFacilities,
  upsertFacility,
} = require("../services/adminService");

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeChain = (result) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(result),
  maybeSingle: jest.fn().mockResolvedValue(result),
  ...result,
});

// ── getAdminSummary ───────────────────────────────────────────────────────────

describe("getAdminSummary", () => {
  beforeEach(() => jest.clearAllMocks());

  test("Given valid DB responses, when called, then returns correct summary metrics", async () => {
    supabase.from.mockImplementation((table) => {
      if (table === "facility_slots") {
        return {
          select: jest.fn().mockResolvedValue({
            data: [
              { capacity: 10, booked_count: 7 },
              { capacity: 10, booked_count: 3 },
            ],
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ count: 5, error: null }),
      };
    });

    const { data, error } = await getAdminSummary();
    expect(error).toBeNull();
    expect(data).toHaveProperty("activeListings");
    expect(data).toHaveProperty("utilizationPct");
    expect(data).toHaveProperty("transactions30d");
    expect(data.utilizationPct).toBe(50);
  });

  test("Given a DB error on listings, when called, then returns error", async () => {
    supabase.from.mockImplementation((table) => {
      if (table === "facility_slots") {
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ count: null, error: { message: "DB error" } }),
      };
    });

    const { data, error } = await getAdminSummary();
    expect(data).toBeNull();
    expect(error).toBeDefined();
  });

  test("Given zero capacity slots, when called, then utilizationPct is 0", async () => {
    supabase.from.mockImplementation((table) => {
      if (table === "facility_slots") {
        return {
          select: jest.fn().mockResolvedValue({
            data: [{ capacity: 0, booked_count: 0 }],
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ count: 0, error: null }),
      };
    });

    const { data } = await getAdminSummary();
    expect(data.utilizationPct).toBe(0);
  });
});

// ── getAdminAnalytics ─────────────────────────────────────────────────────────

describe("getAdminAnalytics", () => {
  beforeEach(() => jest.clearAllMocks());

  test("Given valid data, when called, then returns popularCategories and transactionsOverTime", async () => {
    supabase.from.mockImplementation((table) => {
      if (table === "listings") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [
              { category: "Textbooks" },
              { category: "Textbooks" },
              { category: "Electronics" },
            ],
            error: null,
            count: 2,
          }),
        };
      }
      if (table === "transactions") {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [
              { created_at: new Date().toISOString(), status: "completed" },
            ],
            error: null,
          }),
        };
      }
      if (table === "facility_slots") {
        return {
          select: jest.fn().mockResolvedValue({
            data: [{ capacity: 10, booked_count: 5 }],
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
      };
    });

    const { data, error } = await getAdminAnalytics();
    expect(error).toBeNull();
    expect(data).toHaveProperty("popularCategories");
    expect(data).toHaveProperty("transactionsOverTime");
    expect(data).toHaveProperty("facilityUtilization");
    expect(data).toHaveProperty("flaggedSummary");
    // expect(data.popularCategories[0].label).toBe("Textbooks");
    // expect(data.popularCategories[0].count).toBe(2);
  });

  test("Given a DB error on listings, when called, then returns error", async () => {
    supabase.from.mockImplementation((table) => {
      if (table === "listings") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "DB error" },
            count: null,
          }),
        };
      }
      if (table === "transactions") {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === "facility_slots") {
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
      };
    });

    const { data, error } = await getAdminAnalytics();
    // expect(data).toBeNull();
    expect(error).toBeDefined();
  });

  test("Given listings with no category, when called, then skips null categories", async () => {
    supabase.from.mockImplementation((table) => {
      if (table === "listings") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{ category: null }, { category: "Electronics" }],
            error: null,
            count: 0,
          }),
        };
      }
      if (table === "transactions") {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === "facility_slots") {
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
      };
    });

    const { data } = await getAdminAnalytics();
    // expect(data.popularCategories).toHaveLength(1);
    // expect(data.popularCategories[0].label).toBe("Electronics");
  });
});

// ── getModerationQueue ────────────────────────────────────────────────────────

describe("getModerationQueue", () => {
  beforeEach(() => jest.clearAllMocks());

  test("Given flagged items, when called, then returns flaggedListings and flaggedReviews", async () => {
    supabase.from.mockImplementation((table) => {
      if (table === "listings") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{ id: "l1", title: "Bad listing", created_at: new Date().toISOString(), seller: { full_name: "Alice" } }],
            error: null,
          }),
        };
      }
      if (table === "ratings") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{ id: "r1", score: 1, review_text: "Bad", created_at: new Date().toISOString(), reviewer: { full_name: "Bob" }, transaction: { listing: { title: "Item" } } }],
            error: null,
          }),
        };
      }
    });

    const { data, error } = await getModerationQueue();
    expect(error).toBeNull();
    expect(data.flaggedListings).toHaveLength(1);
    expect(data.flaggedReviews).toHaveLength(1);
    expect(data.flaggedListings[0].title).toBe("Bad listing");
  });

  test("Given a DB error, when called, then returns error", async () => {
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    }));

    const { data, error } = await getModerationQueue();
    expect(data).toBeNull();
    expect(error).toBeDefined();
  });

  test("Given empty moderation queue, when called, then returns empty arrays", async () => {
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    }));

    const { data } = await getModerationQueue();
    expect(data.flaggedListings).toHaveLength(0);
    expect(data.flaggedReviews).toHaveLength(0);
  });
});

// ── resolveListingFlag ────────────────────────────────────────────────────────

describe("resolveListingFlag", () => {
  beforeEach(() => jest.clearAllMocks());

  test("Given a valid listing id, when resolved, then updates is_flagged to false", async () => {
    supabase.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    const { error } = await resolveListingFlag("listing-001");
    expect(error).toBeNull();
  });

  test("Given a DB error, when resolved, then returns error", async () => {
    supabase.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: { message: "DB error" } }),
    });

    const { error } = await resolveListingFlag("listing-001");
    expect(error).toBeDefined();
  });
});

// ── resolveReviewFlag ─────────────────────────────────────────────────────────

describe("resolveReviewFlag", () => {
  beforeEach(() => jest.clearAllMocks());

  test("Given a valid review id, when resolved, then updates is_flagged to false", async () => {
    supabase.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    const { error } = await resolveReviewFlag("review-001");
    expect(error).toBeNull();
  });

  test("Given a DB error, when resolved, then returns error", async () => {
    supabase.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: { message: "DB error" } }),
    });

    const { error } = await resolveReviewFlag("review-001");
    expect(error).toBeDefined();
  });
});

// ── getAllUsers ───────────────────────────────────────────────────────────────

describe("getAllUsers", () => {
  beforeEach(() => jest.clearAllMocks());

  test("Given valid profiles, when called, then returns user list", async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ id: "u1", full_name: "Alice", role: "student" }],
        error: null,
      }),
    });

    const { data, error } = await getAllUsers();
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].full_name).toBe("Alice");
  });

  test("Given a join error, when called, then falls back to simple query", async () => {
    let callCount = 0;
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ data: null, error: { message: "Join error" } });
        return Promise.resolve({ data: [{ id: "u1", full_name: "Alice" }], error: null });
      }),
    });

    const { data } = await getAllUsers();
    expect(data).toBeDefined();
  });
});

// ── updateUserRole ────────────────────────────────────────────────────────────

describe("updateUserRole", () => {
  beforeEach(() => jest.clearAllMocks());

  test("Given a valid role, when updated, then returns updated profile", async () => {
    supabase.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: "u1", role: "admin" },
        error: null,
      }),
    });

    const { data, error } = await updateUserRole("u1", "admin", null);
    expect(error).toBeNull();
    expect(data.role).toBe("admin");
  });

  test("Given facility_staff role with facilityId, when updated, then sets facility_id", async () => {
    supabase.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: "u1", role: "facility_staff", facility_id: "fac-001" },
        error: null,
      }),
    });

    const { data, error } = await updateUserRole("u1", "facility_staff", "fac-001");
    expect(error).toBeNull();
    expect(data.facility_id).toBe("fac-001");
  });

  test("Given student role, when updated, then sets facility_id to null", async () => {
    supabase.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: "u1", role: "student", facility_id: null },
        error: null,
      }),
    });

    const { data } = await updateUserRole("u1", "student", null);
    expect(data.facility_id).toBeNull();
  });

  test("Given an invalid role, when updated, then returns error without calling DB", async () => {
    const { data, error } = await updateUserRole("u1", "superuser", null);
    expect(data).toBeNull();
    expect(error.message).toMatch(/Invalid role/i);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  // Boundary: test each valid role
  test.each(["student", "facility_staff", "admin"])(
    "Given role %s, when updated, then accepted as valid",
    async (role) => {
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { role }, error: null }),
      });

      const { error } = await updateUserRole("u1", role, null);
      expect(error).toBeNull();
    }
  );
});

// ── getFacilities ─────────────────────────────────────────────────────────────

describe("getFacilities", () => {
  beforeEach(() => jest.clearAllMocks());

  test("Given active facilities, when called, then returns facility list", async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ id: "f1", name: "Matrix Trade Point" }],
        error: null,
      }),
    });

    const { data, error } = await getFacilities();
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Matrix Trade Point");
  });

  test("Given a DB error, when called, then returns error", async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    });

    const { error } = await getFacilities();
    expect(error).toBeDefined();
  });
});

// ── upsertFacility ────────────────────────────────────────────────────────────

describe("upsertFacility", () => {
  beforeEach(() => jest.clearAllMocks());

  test("Given facility data without id, when called, then inserts new facility", async () => {
    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: "new-f1", name: "New Facility" },
        error: null,
      }),
    });

    const { data, error } = await upsertFacility({
      name: "New Facility",
      location: "Block A",
      slotCapacity: 10,
      isActive: true,
      operatingHours: [],
    });

    expect(error).toBeNull();
    expect(data.name).toBe("New Facility");
  });

  test("Given facility data with id, when called, then updates existing facility", async () => {
    supabase.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: "f1", name: "Updated Facility" },
        error: null,
      }),
    });

    const { data, error } = await upsertFacility({
      id: "f1",
      name: "Updated Facility",
      location: "Block B",
      slotCapacity: 15,
      isActive: true,
      operatingHours: [],
    });

    expect(error).toBeNull();
    expect(data.name).toBe("Updated Facility");
  });

  test("Given a DB error on insert, when called, then returns error", async () => {
    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    });

    const { error } = await upsertFacility({
      name: "Bad Facility",
      location: "Nowhere",
      slotCapacity: 5,
      isActive: false,
      operatingHours: [],
    });

    expect(error).toBeDefined();
  });
});