const listingService = require("../services/listingService");
const { validateListingInput } = require("../services/listingValidator");
const { supabase } = require("../config/supabaseClient");
const router = require("../routes/listing");
const request = require('supertest');
const express = require('express');


jest.mock("../services/listingService", () => ({
  getActiveListings: jest.fn(),
  getListingsBySellerId: jest.fn(),
  createListing: jest.fn(),
}));

jest.mock("../services/listingValidator", () => ({
  validateListingInput: jest.fn(),
}));

jest.mock("../config/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const getHandler = (method, path) => {
  const layer = router.stack.find(
    (item) =>
      item.route && item.route.path === path && item.route.methods[method],
  );

  if (!layer) {
    throw new Error(`Route not found for ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack[layer.route.stack.length - 1].handle;
};

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("listing routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    test("returns listings on success", async () => {
      listingService.getActiveListings.mockResolvedValue({
        data: [{ id: "listing-1" }],
        error: null,
      });

      const handler = getHandler("get", "/");
      const res = mockRes();

      await handler({}, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        listings: [{ id: "listing-1" }],
      });
    });

    test("returns 500 when service fails", async () => {
      listingService.getActiveListings.mockResolvedValue({
        data: null,
        error: { message: "DB error" },
      });

      const handler = getHandler("get", "/");
      const res = mockRes();

      await handler({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to fetch listings",
        error: "DB error",
      });
    });
  });

  describe("GET /my/:sellerId", () => {
    test("returns 400 when sellerId is missing", async () => {
      const handler = getHandler("get", "/my/:sellerId");
      const res = mockRes();

      await handler({ params: {}, user: { id: "auth-1" } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("returns 401 when user is missing", async () => {
      const handler = getHandler("get", "/my/:sellerId");
      const res = mockRes();

      await handler({ params: { sellerId: "auth-1" } }, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("returns 403 when accessing another seller", async () => {
      const handler = getHandler("get", "/my/:sellerId");
      const res = mockRes();

      await handler(
        { params: { sellerId: "auth-2" }, user: { id: "auth-1" } },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test("returns listings when authorized", async () => {
      listingService.getListingsBySellerId.mockResolvedValue({
        data: [{ id: "listing-2" }],
        error: null,
      });

      const handler = getHandler("get", "/my/:sellerId");
      const res = mockRes();

      await handler(
        { params: { sellerId: "auth-1" }, user: { id: "auth-1" } },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        listings: [{ id: "listing-2" }],
      });
    });
  });

  describe("POST /", () => {
    test("returns 400 when sellerId is missing", async () => {
      const handler = getHandler("post", "/");
      const res = mockRes();

      await handler({ body: {} }, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("returns 400 when validation fails", async () => {
      validateListingInput.mockReturnValue({ valid: false, errors: ["bad"] });

      const handler = getHandler("post", "/");
      const res = mockRes();

      await handler({ body: { sellerId: "auth-1" } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Validation failed",
        errors: ["bad"],
      });
    });

    test("returns 500 when creation fails", async () => {
      validateListingInput.mockReturnValue({ valid: true, errors: [] });
      listingService.createListing.mockResolvedValue({
        data: null,
        error: { message: "Create failed" },
      });

      const handler = getHandler("post", "/");
      const res = mockRes();

      await handler({ body: { sellerId: "auth-1" } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test("returns 201 on success", async () => {
      validateListingInput.mockReturnValue({ valid: true, errors: [] });
      listingService.createListing.mockResolvedValue({
        data: { id: "listing-3" },
        error: null,
      });

      const handler = getHandler("post", "/");
      const res = mockRes();

      await handler({ body: { sellerId: "auth-1" } }, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ listing: { id: "listing-3" } });
    });
  });

  describe("GET /:id", () => {
    test("returns listing when found", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: "listing-4" }],
          error: null,
        }),
      });

      const handler = getHandler("get", "/:id");
      const res = mockRes();

      await handler({ params: { id: "listing-4" } }, res);

      expect(res.json).toHaveBeenCalledWith({ listing: { id: "listing-4" } });
    });

    test("returns 404 when listing is missing", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const handler = getHandler("get", "/:id");
      const res = mockRes();

      await handler({ params: { id: "missing" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns 500 when supabase errors", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "DB error" },
        }),
      });

      const handler = getHandler("get", "/:id");
      const res = mockRes();

      await handler({ params: { id: "listing-5" } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("DELETE /:id", () => {
    test("returns success when deleted", async () => {
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const handler = getHandler("delete", "/:id");
      const res = mockRes();

      await handler({ params: { id: "listing-6" } }, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test("returns 500 when delete fails", async () => {
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: "Delete error" } }),
      });

      const handler = getHandler("delete", "/:id");
      const res = mockRes();

      await handler({ params: { id: "listing-6" } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("PUT /:id", () => {
    test("returns 400 when validation fails", async () => {
      validateListingInput.mockReturnValue({ valid: false, errors: ["bad"] });

      const handler = getHandler("put", "/:id");
      const res = mockRes();

      await handler({ params: { id: "listing-7" }, body: {} }, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("returns 500 when update fails", async () => {
      validateListingInput.mockReturnValue({ valid: true, errors: [] });
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Update error" },
        }),
      });

      const handler = getHandler("put", "/:id");
      const res = mockRes();

      await handler({ params: { id: "listing-7" }, body: {} }, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test("returns listing when updated", async () => {
      validateListingInput.mockReturnValue({ valid: true, errors: [] });
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "listing-7" },
          error: null,
        }),
      });

      const handler = getHandler("put", "/:id");
      const res = mockRes();

      await handler({ params: { id: "listing-7" }, body: {} }, res);

      expect(res.json).toHaveBeenCalledWith({ listing: { id: "listing-7" } });
    });
  });

  describe("POST /:id/images", () => {
    test("returns 500 when insert fails", async () => {
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Insert error" },
        }),
      });

      const handler = getHandler("post", "/:id/images");
      const res = mockRes();

      await handler({ params: { id: "listing-8" }, body: {} }, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test("returns image when inserted", async () => {
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "image-1" },
          error: null,
        }),
      });

      const handler = getHandler("post", "/:id/images");
      const res = mockRes();

      await handler(
        { params: { id: "listing-8" }, body: { storage_path: "x.png" } },
        res,
      );

      expect(res.json).toHaveBeenCalledWith({ image: { id: "image-1" } });
    });
  });
});

//testing listing
// ── Build app ─────────────────────────────────────────────────────────────────
const listingsRouter = require('../routes/listing');
const app = express();
app.use(express.json());
app.use('/api/listings', listingsRouter);

//tests
describe('GET /api/listings/suggested-price', () => {

  // ── Happy path — all valid categories from cpiData.json ──────────────────

  test('Given category Textbooks and a valid price, when fetched, then suggestion is returned with correct Stats SA source', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Textbooks&askingPrice=500');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('suggestion');
    expect(res.body.suggestion).toHaveProperty('low');
    expect(res.body.suggestion).toHaveProperty('high');
    expect(res.body.suggestion.source).toMatch(/Statistics South Africa/i);
  });

  test('Given category Electronics and a valid price, when fetched, then suggestion reflects negative annual CPI change', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Electronics&askingPrice=10000');

    expect(res.status).toBe(200);
    expect(res.body.suggestion).toHaveProperty('annualChangePercent');
    // Electronics annual change is -9.6% from real Stats SA P0141 March 2026
    expect(res.body.suggestion.annualChangePercent).toBe(-9.6);
  });

  test('Given category Furniture and a valid price, when fetched, then 200 is returned', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Furniture&askingPrice=3000');

    expect(res.status).toBe(200);
    expect(res.body.suggestion).toHaveProperty('low');
    expect(res.body.suggestion).toHaveProperty('high');
  });

  test('Given category Clothing and a valid price, when fetched, then correct CPI index is returned', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Clothing&askingPrice=400');

    expect(res.status).toBe(200);
    expect(res.body.suggestion.cpiIndex).toBe(101.6);
  });

  test('Given category Other and a valid price, when fetched, then 200 is returned', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Other&askingPrice=200');

    expect(res.status).toBe(200);
    expect(res.body.suggestion).toHaveProperty('referenceDate');
  });

  // ── Suggested price range logic ───────────────────────────────────────────

  test('Given a valid price and category, when fetched, then low is less than high', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Textbooks&askingPrice=500');

    expect(res.status).toBe(200);
    expect(res.body.suggestion.low).toBeLessThan(res.body.suggestion.high);
  });

  test('Given category Textbooks with 4.2% annual change, when fetched, then range reflects correct CPI adjustment', async () => {
    const askingPrice = 1000;
    const res = await request(app)
      .get(`/api/listings/suggested-price?category=Textbooks&askingPrice=${askingPrice}`);

    expect(res.status).toBe(200);
    const { low, high } = res.body.suggestion;
    expect(low).toBeCloseTo(askingPrice * (1 - 0.042), 1);
    expect(high).toBeCloseTo(askingPrice * (1 + 0.042), 1);
  });

  test('Given category Electronics with -9.6% annual change, when fetched, then range reflects absolute CPI adjustment', async () => {
    const askingPrice = 5000;
    const res = await request(app)
      .get(`/api/listings/suggested-price?category=Electronics&askingPrice=${askingPrice}`);

    expect(res.status).toBe(200);
    const { low, high } = res.body.suggestion;
    expect(low).toBeCloseTo(askingPrice * (1 - 0.096), 1);
    expect(high).toBeCloseTo(askingPrice * (1 + 0.096), 1);
  });

  // ── Validation errors ─────────────────────────────────────────────────────

  test('Given no query params, when fetched, then 400 is returned', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('category and askingPrice are required');
  });

  test('Given missing askingPrice, when fetched, then 400 is returned', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Textbooks');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('category and askingPrice are required');
  });

  test('Given missing category, when fetched, then 400 is returned', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?askingPrice=500');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('category and askingPrice are required');
  });

  test('Given a negative askingPrice, when fetched, then 400 is returned', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Textbooks&askingPrice=-100');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('askingPrice must be a positive number');
  });

  test('Given a zero askingPrice, when fetched, then 400 is returned', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Textbooks&askingPrice=0');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('askingPrice must be a positive number');
  });

  test('Given a non-numeric askingPrice, when fetched, then 400 is returned', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Textbooks&askingPrice=abc');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('askingPrice must be a positive number');
  });

  // ── Invalid category ──────────────────────────────────────────────────────

  test('Given an invalid category not in cpiData.json, when fetched, then 404 is returned', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Groceries&askingPrice=100');

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/No CPI data available/i);
  });

  test('Given an empty category string, when fetched, then 400 is returned', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=&askingPrice=100');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('category and askingPrice are required');
  });

  // ── Stats SA data integrity ───────────────────────────────────────────────

  test('Given any valid category, when fetched, then response includes Stats SA reference date March 2026', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Clothing&askingPrice=300');

    expect(res.status).toBe(200);
    expect(res.body.suggestion.referenceDate).toBe('March 2026');
  });

  test('Given Textbooks category, when fetched, then CPI index matches P0141 March 2026 tertiary education figure', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Textbooks&askingPrice=500');

    expect(res.status).toBe(200);
    // Tertiary education CPI index from P0141 March 2026 Table E
    expect(res.body.suggestion.cpiIndex).toBe(108.1);
  });

  test('Given Electronics category, when fetched, then CPI index matches P0141 March 2026 ICT equipment figure', async () => {
    const res = await request(app)
      .get('/api/listings/suggested-price?category=Electronics&askingPrice=1000');

    expect(res.status).toBe(200);
    // ICT equipment CPI index from P0141 March 2026 Table E
    expect(res.body.suggestion.cpiIndex).toBe(88.2);
  });

});
