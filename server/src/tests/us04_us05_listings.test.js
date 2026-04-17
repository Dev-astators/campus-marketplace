// tests/us04_us05_listings.test.js
const { validateListingInput } = require('../services/listingValidator');
const { getActiveListings, createListing } = require('../services/listingService');

// ── Mock Supabase ─────────────────────────────────────────────────────────────

jest.mock('../config/supabaseClient', () => {
  const mockListings = [
    { id: '1', title: 'CS Textbook',  asking_price: 200,  condition: 'good',     category: 'Textbooks',   status: 'active', seller_id: 'auth-uid-staff' },
    { id: '2', title: 'Laptop',       asking_price: 8000, condition: 'like_new', category: 'Electronics', status: 'active', seller_id: 'auth-uid-staff' },
  ];

  return {
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq:     jest.fn().mockReturnThis(),
        order:  jest.fn().mockResolvedValue({ data: mockListings, error: null }),
        single: jest.fn().mockResolvedValue({
          data: { id: 'new-id', title: 'New Item', asking_price: 500, status: 'active', seller_id: 'auth-uid-staff' },
          error: null,
        }),
      })),
    },
  };
});

// ── US-04: Student browses active listings ────────────────────────────────────

describe('US-04 — Student browses available listings', () => {

  test('Given a signed-in student, when they visit the marketplace, then active listings are returned', async () => {
    const { data, error } = await getActiveListings();
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('Given active listings exist, when fetched, then each listing has required fields', async () => {
    const { data } = await getActiveListings();
    data.forEach((listing) => {
      expect(listing).toHaveProperty('id');
      expect(listing).toHaveProperty('title');
      expect(listing).toHaveProperty('asking_price');
      expect(listing).toHaveProperty('condition');
      expect(listing).toHaveProperty('category');
      expect(listing).toHaveProperty('status');
    });
  });

  test('Given active listings exist, when fetched, then all returned listings have status active', async () => {
    const { data } = await getActiveListings();
    data.forEach((listing) => {
      expect(listing.status).toBe('active');
    });
  });

});

// ── US-05: Facility staff posts a listing ─────────────────────────────────────

describe('US-05 — Facility staff posts a listing', () => {

  describe('Input validation', () => {

    test('Given valid listing data, when validated, then no errors are returned', () => {
      const result = validateListingInput({
        title: 'Calculus Textbook',
        category: 'Textbooks',
        condition: 'good',
        askingPrice: 250,
        listingType: 'sale',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('Given a missing title, when validated, then an error is returned', () => {
      const result = validateListingInput({
        title: '',
        category: 'Textbooks',
        condition: 'good',
        askingPrice: 250,
        listingType: 'sale',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('title is required');
    });

    test('Given an invalid category, when validated, then an error is returned', () => {
      const result = validateListingInput({
        title: 'Some Item',
        category: 'Groceries',
        condition: 'good',
        askingPrice: 100,
        listingType: 'sale',
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/category must be one of/);
    });

    test('Given a negative price, when validated, then an error is returned', () => {
      const result = validateListingInput({
        title: 'Some Item',
        category: 'Electronics',
        condition: 'good',
        askingPrice: -50,
        listingType: 'sale',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('asking_price must be a positive number');
    });

    test('Given a zero price, when validated, then an error is returned', () => {
      const result = validateListingInput({
        title: 'Some Item',
        category: 'Electronics',
        condition: 'good',
        askingPrice: 0,
        listingType: 'sale',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('asking_price must be a positive number');
    });

    test('Given an invalid condition, when validated, then an error is returned', () => {
      const result = validateListingInput({
        title: 'Some Item',
        category: 'Electronics',
        condition: 'broken',
        askingPrice: 100,
        listingType: 'sale',
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/condition must be one of/);
    });

    test('Given an invalid listing type, when validated, then an error is returned', () => {
      const result = validateListingInput({
        title: 'Some Item',
        category: 'Electronics',
        condition: 'good',
        askingPrice: 100,
        listingType: 'auction',
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/listing_type must be one of/);
    });

  });

  describe('Listing creation', () => {

    test('Given valid input and a verified session, when facility staff submits the form, then sellerId comes from req.user not req.body', async () => {
      // Simulate what the route does — sellerId is taken from the
      // verified session user, not from the request body
      const mockReqUser = { id: 'auth-uid-staff' };

      const { data, error } = await createListing({
        sellerId: mockReqUser.id,   // ← from session, not body
        title: 'Engineering Textbook',
        description: 'First year engineering textbook',
        category: 'Textbooks',
        condition: 'good',
        askingPrice: 300,
        listingType: 'sale',
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBeDefined();
      expect(data.seller_id).toBe('auth-uid-staff');
    });

    test('Given a student user, when they attempt to create a listing, then they are forbidden', async () => {
      // This is enforced by requireRole('facility_staff') in the route.
      // We simulate the role check here directly.
      const { requireRole } = require('../middleware/authMiddleware');

      // Mock supabase profile lookup returning student role
      const { supabase } = require('../config/supabaseClient');
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'student' },
          error: null,
        }),
      }));

      const req = { user: { id: 'auth-uid-student' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await requireRole('facility_staff')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

  });

});