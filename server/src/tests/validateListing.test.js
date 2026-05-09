// tests/validateListing.test.js
const { validateListing } = require('../middleware/validateListing');

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Builds a req with a profile already attached (as attachProfile would)
const mockReq = (body, profileId = 'profile-uuid-student-001') => ({
  body,
  profile: { id: profileId, role: 'student' },
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('validateListing middleware', () => {

  test('Given valid listing data, when validated, then req.validatedListing is set and next() is called', () => {
    const req = mockReq({
      title: 'Calculus Textbook',
      description: 'Great condition',
      category: 'Textbooks',
      condition: 'good',
      askingPrice: 250,
      listingType: 'sale',
    });
    const res = mockRes();
    const next = jest.fn();

    validateListing(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.validatedListing).toBeDefined();
    expect(req.validatedListing.sellerId).toBe('profile-uuid-student-001');
  });

  test('Given valid data, when validated, then sellerId comes from req.profile not req.body', () => {
    const req = mockReq({
      title: 'Laptop',
      category: 'Electronics',
      condition: 'like_new',
      askingPrice: 8000,
      listingType: 'sale',
      sellerId: 'spoofed-id', // ← attacker tries to spoof sellerId in body
    });
    const res = mockRes();
    const next = jest.fn();

    validateListing(req, res, next);

    // sellerId must come from profile, not body
    expect(req.validatedListing.sellerId).toBe('profile-uuid-student-001');
    expect(req.validatedListing.sellerId).not.toBe('spoofed-id');
  });

  test('Given a missing title, when validated, then 400 is returned', () => {
    const req = mockReq({
      title: '',
      category: 'Electronics',
      condition: 'good',
      askingPrice: 500,
      listingType: 'sale',
    });
    const res = mockRes();
    const next = jest.fn();

    validateListing(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation failed' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('Given an invalid category, when validated, then 400 is returned', () => {
    const req = mockReq({
      title: 'Some Item',
      category: 'Groceries',
      condition: 'good',
      askingPrice: 100,
      listingType: 'sale',
    });
    const res = mockRes();
    const next = jest.fn();

    validateListing(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('Given a negative price, when validated, then 400 is returned', () => {
    const req = mockReq({
      title: 'Some Item',
      category: 'Electronics',
      condition: 'good',
      askingPrice: -100,
      listingType: 'sale',
    });
    const res = mockRes();
    const next = jest.fn();

    validateListing(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('Given a string askingPrice, when validated, then it is parsed to a float correctly', () => {
    const req = mockReq({
      title: 'Hoodie',
      category: 'Clothing',
      condition: 'new',
      askingPrice: '350.50', // ← comes as string from form
      listingType: 'sale',
    });
    const res = mockRes();
    const next = jest.fn();

    validateListing(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.validatedListing.askingPrice).toBe(350.50);
  });

  test('Given no description, when validated, then description defaults to null', () => {
    const req = mockReq({
      title: 'Desk Lamp',
      category: 'Furniture',
      condition: 'fair',
      askingPrice: 120,
      listingType: 'both',
    });
    const res = mockRes();
    const next = jest.fn();

    validateListing(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.validatedListing.description).toBeNull();
  });

  test('Given title with extra whitespace, when validated, then it is trimmed', () => {
    const req = mockReq({
      title: '   Engineering Notes   ',
      category: 'Textbooks',
      condition: 'good',
      askingPrice: 80,
      listingType: 'sale',
    });
    const res = mockRes();
    const next = jest.fn();

    validateListing(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.validatedListing.title).toBe('Engineering Notes');
  });

});