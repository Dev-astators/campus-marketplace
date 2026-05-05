jest.mock("../services/listingService", () => ({
  getActiveListings: jest.fn(),
  createListing: jest.fn(),
}));

jest.mock("../middleware/authMiddleware", () => ({
  verifySession: (_req, _res, next) => next(),
  attachProfile: (req, _res, next) => {
    req.profile = { id: "profile-1", role: "student" };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
}));

const listingService = require("../services/listingService");
const router = require("../routes/listings");

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

describe("listings routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET / returns listings when successful", async () => {
    listingService.getActiveListings.mockResolvedValue({
      data: [{ id: "listing-1" }],
      error: null,
    });

    const handler = getHandler("get", "/");
    const res = mockRes();

    await handler({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ listings: [{ id: "listing-1" }] });
  });

  test("GET / returns 500 when service fails", async () => {
    listingService.getActiveListings.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const handler = getHandler("get", "/");
    const res = mockRes();

    await handler({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("POST / returns listing on success", async () => {
    listingService.createListing.mockResolvedValue({
      data: { id: "listing-2" },
      error: null,
    });

    const handler = getHandler("post", "/");
    const res = mockRes();

    await handler({ validatedListing: { title: "Test", sellerId: "s1" } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ listing: { id: "listing-2" } });
  });

  test("POST / returns 500 when create fails", async () => {
    listingService.createListing.mockResolvedValue({
      data: null,
      error: { message: "Create failed" },
    });

    const handler = getHandler("post", "/");
    const res = mockRes();

    await handler({ validatedListing: { title: "Test", sellerId: "s1" } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
