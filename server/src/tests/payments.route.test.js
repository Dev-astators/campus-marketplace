/**
 * Unit tests for payments.js (Express router)
 *
 * Run with: npx jest payments.test.js
 */

const request = require("supertest");
const express = require("express");

// ─── Supabase chainable mock ──────────────────────────────────────────────────
const mockSingle       = jest.fn();
const mockMaybeSingle  = jest.fn();
const mockSelect       = jest.fn();
const mockInsert       = jest.fn();
const mockUpdate       = jest.fn();
const mockEq           = jest.fn();
const mockIn           = jest.fn();
const mockGte          = jest.fn();
const mockOrder        = jest.fn();
const mockLimit        = jest.fn();
const mockFrom         = jest.fn();

const chain = () => {
  const c = {
    select:      (...a) => { mockSelect(...a);     return c; },
    insert:      (...a) => {
      const result = mockInsert(...a);
      return result === undefined ? c : result;
    },
    update:      (...a) => {
      const result = mockUpdate(...a);
      return result === undefined ? c : result;
    },
    eq:          (...a) => { mockEq(...a);          return c; },
    in:          (...a) => { mockIn(...a);          return c; },
    gte:         (...a) => { mockGte(...a);         return c; },
    order:       (...a) => {
      const result = mockOrder(...a);
      return result === undefined ? c : result;
    },
    limit:       (...a) => {
      const result = mockLimit(...a);
      return result === undefined ? c : result;
    },
    single:      () => mockSingle(),
    maybeSingle: () => mockMaybeSingle(),
  };
  return c;
};

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (...args) => {
      mockFrom(...args);
      return chain();
    },
  }),
}));

// ─── Mock payfastService ──────────────────────────────────────────────────────
const mockBuildPaymentPayload = jest.fn();
const mockVerifyITN           = jest.fn();

jest.mock("../services/payfastService", () => ({
  buildPaymentPayload: mockBuildPaymentPayload,
  verifyITN:           mockVerifyITN,
}));

// ─── App setup ────────────────────────────────────────────────────────────────
process.env.SUPABASE_URL              = "https://fake.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-key";
process.env.PAYFAST_SANDBOX           = "true";

const paymentsRouter = require("../routes/payments");
const app = express();
app.use(express.json());
app.use("/payments", paymentsRouter);

beforeEach(() => jest.clearAllMocks());

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

  function setupHappyPath() {
    mockSingle
      .mockResolvedValueOnce({ data: activeListing, error: null })
      .mockResolvedValueOnce({ data: buyerProfile,  error: null })
      .mockResolvedValueOnce({ data: { id: "txn-1" }, error: null });
    mockInsert.mockImplementationOnce(() => undefined).mockResolvedValueOnce({ error: null });
    mockBuildPaymentPayload.mockReturnValue(payfastPayload);
  }

  it("returns 400 when listingId is missing", async () => {
    const res = await request(app).post("/payments/initiate").send({ buyerId: "b1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/listingId/i);
  });

  it("returns 400 when buyerId is missing", async () => {
    const res = await request(app).post("/payments/initiate").send({ listingId: "l1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/buyerId/i);
  });

  it("returns 404 when listing is not found", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: new Error("Not found") });

    const res = await request(app).post("/payments/initiate").send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Listing not found.");
  });

  it("returns 400 when listing is not active", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { ...activeListing, status: "sold" },
      error: null,
    });

    const res = await request(app).post("/payments/initiate").send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("This listing is no longer available.");
  });

  it("returns 400 when buyer is also the seller", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { ...activeListing, seller_id: "buyer-1" },
      error: null,
    });

    const res = await request(app).post("/payments/initiate").send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("You cannot buy your own listing.");
  });

  it("returns 404 when buyer profile not found", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: activeListing, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error("Not found") });

    const res = await request(app).post("/payments/initiate").send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Buyer profile not found.");
  });

  it("calculates cash shortfall correctly when partial online amount is given", async () => {
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
    mockSingle
      .mockResolvedValueOnce({ data: activeListing, error: null })
      .mockResolvedValueOnce({ data: buyerProfile,  error: null })
      .mockResolvedValueOnce({ data: { id: "txn-2" }, error: null });
    mockInsert.mockImplementationOnce(() => undefined).mockResolvedValueOnce({ error: null });
    mockBuildPaymentPayload.mockReturnValue(payfastPayload);

    const res = await request(app)
      .post("/payments/initiate")
      .send({ listingId: "listing-1", buyerId: "buyer-1", onlineAmount: 500 });

    expect(res.status).toBe(200);
    expect(res.body.cashShortfall).toBe(0);
  });

  it("clamps online amount to full asking price when it exceeds it", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: activeListing, error: null })
      .mockResolvedValueOnce({ data: buyerProfile,  error: null })
      .mockResolvedValueOnce({ data: { id: "txn-3" }, error: null });
    mockInsert.mockImplementationOnce(() => undefined).mockResolvedValueOnce({ error: null });
    mockBuildPaymentPayload.mockReturnValue(payfastPayload);

    const res = await request(app)
      .post("/payments/initiate")
      .send({ listingId: "listing-1", buyerId: "buyer-1", onlineAmount: 9999 });

    expect(res.status).toBe(200);
    expect(res.body.cashShortfall).toBe(0);
  });

  it("returns 500 on unexpected DB error", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: activeListing, error: null })
      .mockResolvedValueOnce({ data: buyerProfile,  error: null })
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
    mockVerifyITN.mockReturnValue(false);

    const res = await request(app)
      .post("/payments/webhook")
      .type("form")
      .send({ payment_status: "COMPLETE", m_payment_id: "txn-1", pf_payment_id: "pf-ref" });

    expect(res.status).toBe(200);
  });

  it("does not process payment when ITN signature is invalid", async () => {
    mockVerifyITN.mockReturnValue(false);

    await request(app)
      .post("/payments/webhook")
      .type("form")
      .send({ payment_status: "COMPLETE", m_payment_id: "txn-1" });

    const fromCalls = mockFrom.mock.calls.map((c) => c[0]);
    expect(fromCalls).not.toContain("payments");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /payments/confirm-dev
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /payments/confirm-dev", () => {
  it("returns 400 when transactionId is missing", async () => {
    const res = await request(app).post("/payments/confirm-dev").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/transactionId/i);
  });

  it("returns 403 when sandbox env is false", async () => {
    const original = process.env.PAYFAST_SANDBOX;
    process.env.PAYFAST_SANDBOX = "false";

    const freshRouter = require("../routes/payments");
    const freshApp = express();
    freshApp.use(express.json());
    freshApp.use("/payments", freshRouter);

    const res = await request(freshApp)
      .post("/payments/confirm-dev")
      .send({ transactionId: "txn-1" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Not available in production.");
    process.env.PAYFAST_SANDBOX = original;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /payments/status/:transactionId
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /payments/status/:transactionId", () => {
  it("returns 200 with transaction data", async () => {
    const txData = { id: "txn-1", status: "confirmed", listing_id: "l1", online_amount: 300 };
    mockSingle.mockResolvedValueOnce({ data: txData, error: null });

    const res = await request(app).get("/payments/status/txn-1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(txData);
  });

  it("returns 404 when transaction is not found", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: new Error("Not found") });

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
    const facilities = [{ id: "fac-1", name: "Library Hub", location: "Main Campus" }];
    mockOrder.mockResolvedValueOnce({ data: facilities, error: null });

    const res = await request(app).get("/payments/facilities");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(facilities);
  });

  it("returns 500 on DB error", async () => {
    mockOrder.mockResolvedValueOnce({ 
      data: null, 
      error: new Error("DB error")
    });

    const res = await request(app).get("/payments/facilities");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("DB error");
  });
});

// [Rest of the test file remains the same...]