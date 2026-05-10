jest.mock("../services/facilityDashboardService", () => ({
  getFacilityDashboard: jest.fn(),
  advanceFacilityTransaction: jest.fn(),
}));

jest.mock("../middleware/authMiddleware", () => ({
  verifySession: (_req, _res, next) => next(),
  attachProfile: (req, _res, next) => {
    req.profile = { id: "staff-1", full_name: "Karabo Tlaka", role: "facility_staff" };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
}));

const facilityDashboardService = require("../services/facilityDashboardService");
const router = require("../routes/facilityDashboard");

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

describe("facility dashboard routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET / returns dashboard data on success", async () => {
    facilityDashboardService.getFacilityDashboard.mockResolvedValue({
      data: {
        facility: { id: "facility-1", name: "Wits Exchange Hub" },
        slots: [],
        transactions: [],
        activityLog: [],
        metrics: {
          totalCapacity: 0,
          totalBookedSlots: 0,
          fullSlots: 0,
          pendingTransactions: 0,
          completedTransactions: 0,
        },
      },
      error: null,
    });

    const handler = getHandler("get", "/");
    const res = mockRes();

    await handler({ query: { date: "2026-05-10" } }, res);

    expect(facilityDashboardService.getFacilityDashboard).toHaveBeenCalledWith(
      "2026-05-10",
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("POST /transactions/:transactionId/actions validates the action", async () => {
    const handler = getHandler("post", "/transactions/:transactionId/actions");
    const res = mockRes();

    await handler(
      {
        params: { transactionId: "TX-1" },
        body: { action: "bad_action" },
        profile: { id: "staff-1", full_name: "Karabo Tlaka" },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(
      facilityDashboardService.advanceFacilityTransaction,
    ).not.toHaveBeenCalled();
  });

  test("POST /transactions/:transactionId/actions advances the transaction", async () => {
    facilityDashboardService.advanceFacilityTransaction.mockResolvedValue({
      data: {
        facility: { id: "facility-1", name: "Wits Exchange Hub" },
        slots: [],
        transactions: [],
        activityLog: [],
        metrics: {
          totalCapacity: 0,
          totalBookedSlots: 0,
          fullSlots: 0,
          pendingTransactions: 0,
          completedTransactions: 0,
        },
      },
      error: null,
    });

    const handler = getHandler("post", "/transactions/:transactionId/actions");
    const res = mockRes();

    await handler(
      {
        params: { transactionId: "TX-1" },
        body: { action: "confirm_dropoff" },
        profile: { id: "staff-1", full_name: "Karabo Tlaka" },
      },
      res,
    );

    expect(facilityDashboardService.advanceFacilityTransaction).toHaveBeenCalledWith({
      transactionId: "TX-1",
      action: "confirm_dropoff",
      staffIdentifier: "Karabo Tlaka",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
