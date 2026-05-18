/**
 * Unit tests for admin.js (Express router)
 *
 * Run with: npx jest admin.test.js
 *
 * Strategy: mock all adminService functions and authMiddleware,
 * then drive the router with supertest.
 */

const request = require("supertest");
const express = require("express");

// ─── Mock auth middleware ─────────────────────────────────────────────────────
jest.mock("../middleware/authMiddleware", () => ({
  verifySession:  (req, _res, next) => next(),
  attachProfile:  (req, _res, next) => { req.profile = { id: "admin-1", role: "admin" }; next(); },
  requireRole:    (_role) => (_req, _res, next) => next(),
}));

// ─── Mock adminService ────────────────────────────────────────────────────────
jest.mock("../services/adminService", () => ({
  getAdminSummary:     jest.fn(),
  getAdminAnalytics:   jest.fn(),
  getModerationQueue:  jest.fn(),
  resolveListingFlag:  jest.fn(),
  resolveReviewFlag:   jest.fn(),
  getAllUsers:          jest.fn(),
  updateUserRole:      jest.fn(),
  getFacilities:       jest.fn(),
  upsertFacility:      jest.fn(),
}));

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

const adminRouter = require("../routes/admin");

// Build a minimal Express app for testing
const app = express();
app.use(express.json());
app.use("/admin", adminRouter);

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/summary
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /admin/summary", () => {
  it("returns 200 with summary data", async () => {
    const summary = { totalUsers: 42, totalListings: 120 };
    getAdminSummary.mockResolvedValue({ data: summary, error: null });

    const res = await request(app).get("/admin/summary");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(summary);
    expect(getAdminSummary).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when service throws", async () => {
    getAdminSummary.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const res = await request(app).get("/admin/summary");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message", "Failed to fetch summary");
    expect(res.body.error).toBe("DB error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/analytics
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /admin/analytics", () => {
  it("returns 200 with analytics data", async () => {
    const analytics = { salesPerDay: [1, 2, 3] };
    getAdminAnalytics.mockResolvedValue({ data: analytics, error: null });

    const res = await request(app).get("/admin/analytics");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(analytics);
  });

  it("returns 500 on service error", async () => {
    getAdminAnalytics.mockResolvedValue({ data: null, error: { message: "Analytics failed" } });

    const res = await request(app).get("/admin/analytics");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to fetch analytics");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/moderation
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /admin/moderation", () => {
  it("returns 200 with the moderation queue", async () => {
    const queue = [{ id: "flag-1", type: "listing" }];
    getModerationQueue.mockResolvedValue({ data: queue, error: null });

    const res = await request(app).get("/admin/moderation");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(queue);
  });

  it("returns 500 on service error", async () => {
    getModerationQueue.mockResolvedValue({ data: null, error: { message: "Queue error" } });

    const res = await request(app).get("/admin/moderation");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to fetch moderation queue");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /admin/moderation/listings/:id/resolve
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /admin/moderation/listings/:id/resolve", () => {
  it("returns 200 on successful resolve", async () => {
    resolveListingFlag.mockResolvedValue({ error: null });

    const res = await request(app).patch("/admin/moderation/listings/listing-1/resolve");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(resolveListingFlag).toHaveBeenCalledWith("listing-1");
  });

  it("returns 500 on service error", async () => {
    resolveListingFlag.mockResolvedValue({ error: { message: "Resolve failed" } });

    const res = await request(app).patch("/admin/moderation/listings/listing-1/resolve");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to resolve listing flag");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /admin/moderation/reviews/:id/resolve
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /admin/moderation/reviews/:id/resolve", () => {
  it("returns 200 on successful resolve", async () => {
    resolveReviewFlag.mockResolvedValue({ error: null });

    const res = await request(app).patch("/admin/moderation/reviews/review-1/resolve");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(resolveReviewFlag).toHaveBeenCalledWith("review-1");
  });

  it("returns 500 on service error", async () => {
    resolveReviewFlag.mockResolvedValue({ error: { message: "Review resolve failed" } });

    const res = await request(app).patch("/admin/moderation/reviews/review-1/resolve");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to resolve review flag");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/users
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /admin/users", () => {
  it("returns 200 with all users", async () => {
    const users = [{ id: "u1", full_name: "Bob" }, { id: "u2", full_name: "Carol" }];
    getAllUsers.mockResolvedValue({ data: users, error: null });

    const res = await request(app).get("/admin/users");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("returns 500 on service error", async () => {
    getAllUsers.mockResolvedValue({ data: null, error: { message: "Users fetch failed" } });

    const res = await request(app).get("/admin/users");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to fetch users");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /admin/users/:userId/role
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /admin/users/:userId/role", () => {
  it("returns 200 when role is updated successfully", async () => {
    const updated = { id: "u1", role: "facility_staff" };
    updateUserRole.mockResolvedValue({ data: updated, error: null });

    const res = await request(app)
      .patch("/admin/users/u1/role")
      .send({ role: "facility_staff", facilityId: "fac-1" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(updateUserRole).toHaveBeenCalledWith("u1", "facility_staff", "fac-1");
  });

  it("returns 400 when role field is missing", async () => {
    const res = await request(app)
      .patch("/admin/users/u1/role")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("role field is required");
    expect(updateUserRole).not.toHaveBeenCalled();
  });

  it("returns 400 when service returns an error", async () => {
    updateUserRole.mockResolvedValue({ data: null, error: { message: "Invalid role value" } });

    const res = await request(app)
      .patch("/admin/users/u1/role")
      .send({ role: "superuser" }); // invalid role

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Failed to update role");
    expect(res.body.error).toBe("Invalid role value");
  });

  it("passes facilityId as undefined when not supplied", async () => {
    updateUserRole.mockResolvedValue({ data: { id: "u1" }, error: null });

    await request(app)
      .patch("/admin/users/u1/role")
      .send({ role: "student" });

    expect(updateUserRole).toHaveBeenCalledWith("u1", "student", undefined);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/facilities
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /admin/facilities", () => {
  it("returns 200 with facility list", async () => {
    const facilities = [{ id: "fac-1", name: "Library Hub" }];
    getFacilities.mockResolvedValue({ data: facilities, error: null });

    const res = await request(app).get("/admin/facilities");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(facilities);
  });

  it("returns 500 on service error", async () => {
    getFacilities.mockResolvedValue({ data: null, error: { message: "DB down" } });

    const res = await request(app).get("/admin/facilities");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to fetch facilities");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/facilities
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /admin/facilities", () => {
  const newFacility = { name: "Science Block", location: "Block C, Room 101", slot_capacity: 10 };

  it("returns 201 on successful creation", async () => {
    const created = { id: "fac-new", ...newFacility };
    upsertFacility.mockResolvedValue({ data: created, error: null });

    const res = await request(app).post("/admin/facilities").send(newFacility);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
    expect(upsertFacility).toHaveBeenCalledWith(newFacility);
  });

  it("returns 500 on service error", async () => {
    upsertFacility.mockResolvedValue({ data: null, error: { message: "Insert failed" } });

    const res = await request(app).post("/admin/facilities").send(newFacility);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to create facility");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /admin/facilities/:id
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /admin/facilities/:id", () => {
  it("returns 200 on successful update and merges :id into body", async () => {
    const updated = { id: "fac-1", name: "Updated Hub" };
    upsertFacility.mockResolvedValue({ data: updated, error: null });

    const res = await request(app)
      .patch("/admin/facilities/fac-1")
      .send({ name: "Updated Hub" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    // Confirm that the route merged the :id param into the service call
    expect(upsertFacility).toHaveBeenCalledWith({ name: "Updated Hub", id: "fac-1" });
  });

  it("returns 500 on service error", async () => {
    upsertFacility.mockResolvedValue({ data: null, error: { message: "Update failed" } });

    const res = await request(app)
      .patch("/admin/facilities/fac-1")
      .send({ name: "X" });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to update facility");
  });
});