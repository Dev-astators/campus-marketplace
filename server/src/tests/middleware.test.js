const { verifySession } = require('../middleware/authMiddleware');

// ── Mock Supabase ─────────────────────────────────────────────────────────────

jest.mock('../config/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
}));

const { supabase } = require('../config/supabaseClient');

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

describe('verifySession middleware', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Given a valid token, when verified, then req.user is set and next() is called', async () => {
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'auth-uid-001', email: 'student@students.wits.ac.za' } },
      error: null,
    });

    const req = mockReq('Bearer valid-token-123');
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(req.user).toBeDefined();
    expect(req.user.email).toBe('student@students.wits.ac.za');
  });

  test('Given no Authorization header, when verified, then 401 is returned', async () => {
    const req = mockReq(undefined);
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorised: no token provided' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('Given a header without Bearer prefix, when verified, then 401 is returned', async () => {
    const req = mockReq('invalid-token-format');
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('Given a malformed Bearer header with no token, when verified, then 401 is returned', async () => {
    const req = mockReq('Bearer ');
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorised: malformed token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('Given an expired token, when verified, then 401 is returned', async () => {
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'JWT expired' },
    });

    const req = mockReq('Bearer expired-token-123');
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorised: invalid or expired token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('Given an invalid token, when verified, then 401 is returned', async () => {
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid JWT' },
    });

    const req = mockReq('Bearer invalid-token-abc');
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('Given a Supabase server error, when verified, then 500 is returned', async () => {
    supabase.auth.getUser.mockRejectedValueOnce(new Error('Supabase unreachable'));

    const req = mockReq('Bearer some-token');
    const res = mockRes();

    await verifySession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error during authentication' });
    expect(mockNext).not.toHaveBeenCalled();
  });

});
