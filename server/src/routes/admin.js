const express = require("express");
const router = express.Router();
const {
  verifySession,
  requireRole,
  attachProfile,
} = require("../middleware/authMiddleware");
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

// All admin routes require authentication + admin role
const adminOnly = [verifySession, attachProfile, requireRole("admin")];

// ─── Summary cards ─────────────────────────────────────────────────────────────
router.get("/summary", ...adminOnly, async (req, res) => {
  const { data, error } = await getAdminSummary();
  if (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch summary", error: error.message });
  }
  return res.status(200).json(data);
});

// ─── Analytics ─────────────────────────────────────────────────────────────────
router.get("/analytics", ...adminOnly, async (req, res) => {
  const { data, error } = await getAdminAnalytics();
  if (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch analytics", error: error.message });
  }
  return res.status(200).json(data);
});

// ─── Moderation ────────────────────────────────────────────────────────────────
router.get("/moderation", ...adminOnly, async (req, res) => {
  const { data, error } = await getModerationQueue();
  if (error) {
    return res
      .status(500)
      .json({
        message: "Failed to fetch moderation queue",
        error: error.message,
      });
  }
  return res.status(200).json(data);
});

router.patch(
  "/moderation/listings/:id/resolve",
  ...adminOnly,
  async (req, res) => {
    const { error } = await resolveListingFlag(req.params.id);
    if (error) {
      return res
        .status(500)
        .json({
          message: "Failed to resolve listing flag",
          error: error.message,
        });
    }
    return res.status(200).json({ success: true });
  },
);

router.patch(
  "/moderation/reviews/:id/resolve",
  ...adminOnly,
  async (req, res) => {
    const { error } = await resolveReviewFlag(req.params.id);
    if (error) {
      return res
        .status(500)
        .json({
          message: "Failed to resolve review flag",
          error: error.message,
        });
    }
    return res.status(200).json({ success: true });
  },
);

// ─── User management ──────────────────────────────────────────────────────────
router.get("/users", ...adminOnly, async (req, res) => {
  const { data, error } = await getAllUsers();
  if (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch users", error: error.message });
  }
  return res.status(200).json(data);
});

router.patch("/users/:userId/role", ...adminOnly, async (req, res) => {
  const { role } = req.body;
  if (!role) {
    return res.status(400).json({ message: "role field is required" });
  }

  const { data, error } = await updateUserRole(req.params.userId, role);
  if (error) {
    return res
      .status(400)
      .json({ message: "Failed to update role", error: error.message });
  }
  return res.status(200).json(data);
});

// ─── Facility settings ────────────────────────────────────────────────────────
router.get("/facilities", ...adminOnly, async (req, res) => {
  const { data, error } = await getFacilities();
  if (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch facilities", error: error.message });
  }
  return res.status(200).json(data);
});

router.post("/facilities", ...adminOnly, async (req, res) => {
  const { data, error } = await upsertFacility(req.body);
  if (error) {
    return res
      .status(500)
      .json({ message: "Failed to create facility", error: error.message });
  }
  return res.status(201).json(data);
});

router.patch("/facilities/:id", ...adminOnly, async (req, res) => {
  const { data, error } = await upsertFacility({
    ...req.body,
    id: req.params.id,
  });
  if (error) {
    return res
      .status(500)
      .json({ message: "Failed to update facility", error: error.message });
  }
  return res.status(200).json(data);
});

module.exports = router;