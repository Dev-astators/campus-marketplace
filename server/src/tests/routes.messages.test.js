const mockSupabase = {
  from: jest.fn(),
};

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => mockSupabase),
}));

const router = require("../routes/messages");

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

describe("messages routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /", () => {
    test("returns 400 when content is missing", async () => {
      const handler = getHandler("post", "/");
      const res = mockRes();

      await handler(
        { body: { listing_id: "l1", sender_id: "s1", receiver_id: "r1" } },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("returns message when insert succeeds", async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: "msg-1" }],
          error: null,
        }),
      });

      const handler = getHandler("post", "/");
      const res = mockRes();

      await handler(
        {
          body: {
            listing_id: "l1",
            sender_id: "s1",
            receiver_id: "r1",
            content: "Hi",
          },
        },
        res,
      );

      expect(res.json).toHaveBeenCalledWith({ message: { id: "msg-1" } });
    });

    test("returns 500 when insert fails", async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Insert error" },
        }),
      });

      const handler = getHandler("post", "/");
      const res = mockRes();

      await handler(
        {
          body: {
            listing_id: "l1",
            sender_id: "s1",
            receiver_id: "r1",
            content: "Hi",
          },
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("GET /:listingId/:userA/:userB", () => {
    test("returns messages on success", async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ id: "msg-2" }],
          error: null,
        }),
      });

      const handler = getHandler("get", "/:listingId/:userA/:userB");
      const res = mockRes();

      await handler(
        { params: { listingId: "l1", userA: "s1", userB: "r1" } },
        res,
      );

      expect(res.json).toHaveBeenCalledWith({ messages: [{ id: "msg-2" }] });
    });

    test("returns 500 when query fails", async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Query error" },
        }),
      });

      const handler = getHandler("get", "/:listingId/:userA/:userB");
      const res = mockRes();

      await handler(
        { params: { listingId: "l1", userA: "s1", userB: "r1" } },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("GET /user/:userId", () => {
    test("returns messages on success", async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ id: "msg-3" }],
          error: null,
        }),
      });

      const handler = getHandler("get", "/user/:userId");
      const res = mockRes();

      await handler({ params: { userId: "u1" } }, res);

      expect(res.json).toHaveBeenCalledWith({ messages: [{ id: "msg-3" }] });
    });

    test("returns 500 when query fails", async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Query error" },
        }),
      });

      const handler = getHandler("get", "/user/:userId");
      const res = mockRes();

      await handler({ params: { userId: "u1" } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
