const express = require("express");
const router = express.Router();
const {
  advanceFacilityTransaction,
  getFacilityDashboard,
} = require("../services/facilityDashboardService");
const {
  verifySession,
  requireRole,
  attachProfile,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  verifySession,
  attachProfile,
  requireRole("facility_staff", "admin"),
  async (req, res) => {
    const selectedDate = req.query.date;
    const requestedFacilityId =
      req.userRole === "admin" ? req.query.facilityId : req.profile.facility_id;
    const { data, error } = await getFacilityDashboard(
      selectedDate,
      requestedFacilityId,
      req.userRole,
    );

    if (error) {
      return res.status(error.statusCode || 500).json({
        message: "Failed to fetch facility dashboard data",
        error: error.message,
      });
    }

    return res.status(200).json(data);
  },
);

router.post(
  "/transactions/:transactionId/actions",
  verifySession,
  attachProfile,
  requireRole("facility_staff", "admin"),
  async (req, res) => {
    const { transactionId } = req.params;
    const { action, selectedDate } = req.body;

    const validActions = [
      "confirm_dropoff",
      "confirm_buyer_arrival",
      "confirm_cash_handoff",
      "release_item",
    ];

    if (!transactionId) {
      return res.status(400).json({ message: "transactionId is required" });
    }

    if (!action || !validActions.includes(action)) {
      return res.status(400).json({
        message: `action must be one of: ${validActions.join(", ")}`,
      });
    }

    const { data, error } = await advanceFacilityTransaction({
      transactionId,
      action,
      selectedDate,
      staffIdentifier: req.profile.full_name || req.profile.id,
      facilityId: req.profile.facility_id,
      userRole: req.userRole,
    });

    if (error) {
      const statusCode = error.statusCode ||
        (error.message &&
        (error.message.includes("No drop-off booking") ||
          error.message.includes("No collection booking"))
          ? 400
          : 500);

      return res.status(statusCode).json({
        message: "Failed to update facility transaction",
        error: error.message,
      });
    }

    return res.status(200).json(data);
  },
);

module.exports = router;
