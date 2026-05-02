const {
  verifySession,
  requireRole,
  attachProfile,
} = require("../middleware/authMiddleware");

// ── Mock Supabase ─────────────────────────────────────────────────────────────

jest.mock("../config/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
}));

const { supabase } = require("../config/supabaseClient");

// ── Helpers ───────────────────────────────────────────────────────────────────

// Builds a mock Express req object
const mockReq = (authHeader) => ({
  headers: { authorization: authHeader },
});

// Builds mock res with status and json chain
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("verifySession middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Given a valid token, when verified, then req.user is set and next() is called", async () => {
    supabase.auth.getUser.mockResolvedValueOnce({
      data: {
        user: { id: "auth-uid-001", email: "student@students.wits.ac.za" },
      },
      error: null,
    });

    const req = mockReq("Bearer valid-token-123");
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(req.user).toBeDefined();
    expect(req.user.email).toBe("student@students.wits.ac.za");
  });

  test("Given no Authorization header, when verified, then 401 is returned", async () => {
    const req = mockReq(undefined);
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unauthorised: no token provided",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("Given a header without Bearer prefix, when verified, then 401 is returned", async () => {
    const req = mockReq("invalid-token-format");
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("Given a malformed Bearer header with no token, when verified, then 401 is returned", async () => {
    const req = mockReq("Bearer ");
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unauthorised: malformed token",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("Given an expired token, when verified, then 401 is returned", async () => {
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "JWT expired" },
    });

    const req = mockReq("Bearer expired-token-123");
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unauthorised: invalid or expired token",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("Given an invalid token, when verified, then 401 is returned", async () => {
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Invalid JWT" },
    });

    const req = mockReq("Bearer invalid-token-abc");
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("Given a Supabase server error, when verified, then 500 is returned", async () => {
    supabase.auth.getUser.mockRejectedValueOnce(
      new Error("Supabase unreachable"),
    );

    const req = mockReq("Bearer some-token");
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error during authentication",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

// ── requireRole tests ─────────────────────────────────────────────────────────

describe("requireRole middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper — builds req with user already attached (as verifySession would)
  const mockReqWithUser = (userId) => ({
    headers: {},
    user: { id: userId, email: "user@students.wits.ac.za" },
  });

  test("Given a facility_staff user, when role is required, then next() is called", async () => {
    supabase.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: "facility_staff" },
        error: null,
      }),
    }));

    const req = mockReqWithUser("auth-uid-staff");
    const res = mockRes();
    const next = jest.fn();

    await requireRole("facility_staff")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userRole).toBe("facility_staff");
  });

  test("Given an admin user, when facility_staff or admin is required, then next() is called", async () => {
    supabase.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: "admin" },
        error: null,
      }),
    }));

    const req = mockReqWithUser("auth-uid-admin");
    const res = mockRes();
    const next = jest.fn();

    await requireRole("facility_staff", "admin")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userRole).toBe("admin");
  });

  test("Given a student user, when facility_staff is required, then 403 is returned", async () => {
    supabase.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: "student" },
        error: null,
      }),
    }));

    const req = mockReqWithUser("auth-uid-student");
    const res = mockRes();
    const next = jest.fn();

    await requireRole("facility_staff")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("Given no user on request, when role is checked, then 401 is returned", async () => {
    const req = { headers: {}, user: null };
    const res = mockRes();
    const next = jest.fn();

    await requireRole("facility_staff")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("Given a profile lookup failure, when role is checked, then 500 is returned", async () => {
    supabase.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "DB error" },
      }),
    }));

    const req = mockReqWithUser("auth-uid-broken");
    const res = mockRes();
    const next = jest.fn();

    await requireRole("facility_staff")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });

  test("Given a Supabase crash, when role is checked, then 500 is returned", async () => {
    supabase.from = jest.fn(() => {
      throw new Error("Supabase unreachable");
    });

    const req = mockReqWithUser("auth-uid-crash");
    const res = mockRes();
    const next = jest.fn();

    await requireRole("facility_staff")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});

// ── attachProfile tests ───────────────────────────────────────────────────────

describe("attachProfile middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReqWithUser = (userId) => ({
    headers: {},
    user: { id: userId },
  });

  test("Given a valid user with a complete profile, when attached, then req.profile is set and next() is called", async () => {
    supabase.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: "profile-uuid-001",
          full_name: "Nkosinathi Khumalo",
          email: "nkosinathi@students.wits.ac.za",
          student_number: "STU001",
          university: "Wits",
          role: "student",
          average_rating: 0,
        },
        error: null,
      }),
    }));

    const req = mockReqWithUser("auth-uid-001");
    const res = mockRes();
    const next = jest.fn();

    await attachProfile(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.profile).toBeDefined();
    expect(req.profile.role).toBe("student");
    expect(req.profile.student_number).toBe("STU001");
  });

  test("Given a user with no profile, when attached, then a profile is created and next() is called", async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "No rows found" },
      }),
    };

    const insertChain = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: "profile-uuid-new",
          full_name: "Student Test",
          email: "test@students.wits.ac.za",
          student_number: "1234567",
          university: "University of the Witwatersrand",
          role: "student",
          average_rating: 0,
        },
        error: null,
      }),
    };

    supabase.from = jest
      .fn()
      .mockImplementationOnce(() => selectChain)
      .mockImplementationOnce(() => insertChain);

    const req = {
      headers: {},
      user: {
        id: "auth-uid-no-profile",
        email: "test@students.wits.ac.za",
        user_metadata: { full_name: "Student Test" },
      },
    };
    const res = mockRes();
    const next = jest.fn();

    await attachProfile(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.profile).toBeDefined();
    expect(req.profile.role).toBe("student");
  });

  test("Given no user on request, when attached, then 401 is returned", async () => {
    const req = { headers: {}, user: null };
    const res = mockRes();
    const next = jest.fn();

    await attachProfile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("Given a Supabase crash, when profile is fetched, then 500 is returned", async () => {
    supabase.from = jest.fn(() => {
      throw new Error("Supabase unreachable");
    });

    const req = mockReqWithUser("auth-uid-crash");
    const res = mockRes();
    const next = jest.fn();

    await attachProfile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });

  test("Given a facility_staff profile, when attached, then req.profile.role is facility_staff", async () => {
    supabase.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: "profile-uuid-002",
          full_name: "Staff Member",
          email: "staff@students.wits.ac.za",
          role: "facility_staff",
          average_rating: 0,
        },
        error: null,
      }),
    }));

    const req = mockReqWithUser("auth-uid-staff");
    const res = mockRes();
    const next = jest.fn();

    await attachProfile(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.profile.role).toBe("facility_staff");
  });
});
