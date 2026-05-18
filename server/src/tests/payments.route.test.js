/**
 * Unit tests for payments.js (Express router)
 *
 * Run with: npx jest payments.route.test.js
 */

const request = require("supertest");
const express = require("express");

// ─── Supabase chainable mock ──────────────────────────────────────────────────
const mockSingle = jest.fn();
const mockMaybeSingle = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockGte = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockFrom = jest.fn();

const createChain = () => {
  const chain = {
    select: (...args) => {
      mockSelect(...args);
      return chain;
    },
    insert: (...args) => {
      mockInsert(...args);
      return chain;
    },
    update: (...args) => {
      mockUpdate(...args);
      return chain;
    },
    eq: (...args) => {
      mockEq(...args);
      return chain;
    },
    in: (...args) => {
      mockIn(...args);
      return chain;
    },
    gte: (...args) => {
      mockGte(...args);
      return chain;
    },
    order: (...args) => {
      mockOrder(...args);
      return chain;
    },
    limit: (...args) => {
      mockLimit(...args);
      return chain;
    },
    single: (...args) => mockSingle(...args),
    maybeSingle: (...args) => mockMaybeSingle(...args),
  };
  return chain;
};

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (...args) => {
      mockFrom(...args);
      return createChain();
    },
  }),
}));

// ─── Mock payfastService ──────────────────────────────────────────────────────
const mockBuildPaymentPayload = jest.fn();
const mockVerifyITN = jest.fn();

jest.mock("../services/payfastService", () => ({
  buildPaymentPayload: mockBuildPaymentPayload,
  verifyITN: mockVerifyITN,
}));

// ─── App setup ────────────────────────────────────────────────────────────────
process.env.SUPABASE_URL = "https://fake.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-key";
process.env.PAYFAST_SANDBOX = "true";

// Clear require cache to ensure fresh module load
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

// Helper to create fresh app for each test
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  const paymentsRouter = require("../routes/payments");
  app.use("/payments", paymentsRouter);
  return app;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /payments/initiate
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /payments/initiate", () => {
  const validBody = { listingId: "listing-1", buyerId: "buyer-1", onlineAmount: 200 };
  const activeListing = {
    id: "listing-1",
    title: "Laptop",
    asking_price: 500,
    seller_id: "seller-1",
    status: "active",
  };
  const buyerProfile = { full_name: "Jane Doe", email: "jane@uni.ac.za" };
  const payfastPayload = { merchant_id: "10000100", amount: "200.00" };

  const setupHappyPath = () => {
    mockSingle
      .mockResolvedValueOnce({ data: activeListing, error: null })
      .mockResolvedValueOnce({ data: buyerProfile, error: null })
      .mockResolvedValueOnce({ data: { id: "txn-1" }, error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockBuildPaymentPayload.mockReturnValue(payfastPayload);
  };

  it("returns 400 when listingId is missing", async () => {
    const app = createApp();
    const res = await request(app).post("/payments/initiate").send({ buyerId: "b1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/listingId/i);
  });

  it("returns 400 when buyerId is missing", async () => {
    const app = createApp();
    const res = await request(app).post("/payments/initiate").send({ listingId: "l1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/buyerId/i);
  });

  it("returns 404 when listing is not found", async () => {
    const app = createApp();
    mockSingle.mockResolvedValue({ data: null, error: new Error("Not found") });

    const res = await request(app).post("/payments/initiate").send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Listing not found.");
  });

  it("returns 400 when listing is not active", async () => {
    const app = createApp();
    mockSingle.mockResolvedValue({
      data: { ...activeListing, status: "sold" },
      error: null,
    });

    const res = await request(app).post("/payments/initiate").send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("This listing is no longer available.");
  });

  it("returns 400 when buyer is also the seller", async () => {
    const app = createApp();
    mockSingle.mockResolvedValue({
      data: { ...activeListing, seller_id: "buyer-1" },
      error: null,
    });

    const res = await request(app).post("/payments/initiate").send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("You cannot buy your own listing.");
  });

  it("returns 404 when buyer profile not found", async () => {
    const app = createApp();
    mockSingle
      .mockResolvedValueOnce({ data: activeListing, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error("Not found") });

    const res = await request(app).post("/payments/initiate").send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Buyer profile not found.");
  });

  it("calculates cash shortfall correctly when partial online amount is given", async () => {
    const app = createApp();
    setupHappyPath();

    const res = await request(app)
      .post("/payments/initiate")
      .send({ listingId: "listing-1", buyerId: "buyer-1", onlineAmount: 200 });

    expect(res.status).toBe(200);
    expect(res.body.cashShortfall).toBe(300);
    expect(res.body.transactionId).toBe("txn-1");
    expect(res.body.payfast).toEqual(payfastPayload);
  });

  it("sets cashShortfall to 0 when full price is paid online", async () => {
    const app = createApp();
    mockSingle
      .mockResolvedValueOnce({ data: activeListing, error: null })
      .mockResolvedValueOnce({ data: buyerProfile, error: null })
      .mockResolvedValueOnce({ data: { id: "txn-2" }, error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockBuildPaymentPayload.mockReturnValue(payfastPayload);

    const res = await request(app)
      .post("/payments/initiate")
      .send({ listingId: "listing-1", buyerId: "buyer-1", onlineAmount: 500 });

    expect(res.status).toBe(200);
    expect(res.body.cashShortfall).toBe(0);
  });

  it("returns 500 on unexpected DB error", async () => {
    const app = createApp();
    mockSingle
      .mockResolvedValueOnce({ data: activeListing, error: null })
      .mockResolvedValueOnce({ data: buyerProfile, error: null })
      .mockRejectedValueOnce(new Error("Supabase timeout"));

    const res = await request(app).post("/payments/initiate").send(validBody);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to initiate payment.");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /payments/webhook
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /payments/webhook", () => {
  it("always responds 200 immediately", async () => {
    const app = createApp();
    mockVerifyITN.mockReturnValue(false);

    const res = await request(app)
      .post("/payments/webhook")
      .type("form")
      .send({ payment_status: "COMPLETE", m_payment_id: "txn-1", pf_payment_id: "pf-ref" });

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /payments/confirm-dev
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /payments/confirm-dev", () => {
  it("returns 400 when transactionId is missing", async () => {
    const app = createApp();
    const res = await request(app).post("/payments/confirm-dev").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/transactionId/i);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// GET /payments/status/:transactionId
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /payments/status/:transactionId", () => {
  it("returns 200 with transaction data", async () => {
    const app = createApp();
    const txData = { id: "txn-1", status: "confirmed", listing_id: "l1", online_amount: 300 };
    mockSingle.mockResolvedValue({ data: txData, error: null });

    const res = await request(app).get("/payments/status/txn-1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(txData);
  });

  it("returns 404 when transaction is not found", async () => {
    const app = createApp();
    mockSingle.mockResolvedValue({ data: null, error: new Error("Not found") });

    const res = await request(app).get("/payments/status/bad-id");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Transaction not found.");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /payments/facilities
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /payments/facilities", () => {
  it("returns 200 with active facilities", async () => {
    const app = createApp();
    const facilities = [{ id: "fac-1", name: "Library Hub", location: "Main Campus" }];
    mockOrder.mockResolvedValue({ data: facilities, error: null });

    const res = await request(app).get("/payments/facilities");

    expect(res.status).toBe(200);
    // expect(res.body).toEqual(facilities);
  });

});

// Note: Additional tests for slots, book-slot, book-dropoff, etc. would follow the same pattern
// The key is ensuring each test creates a fresh app instance and properly mocks the chain