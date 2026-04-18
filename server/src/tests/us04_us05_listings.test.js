// tests/us04_us05_listings.test.js
const { validateListingInput } = require('../services/listingValidator');
const { getActiveListings, createListing } = require('../services/listingService');

// ── Mock Supabase ─────────────────────────────────────────────────────────────

jest.mock('../config/supabaseClient', () => {
  const mockListings = [
    { id: '1', title: 'CS Textbook',  asking_price: 200,  condition: 'good',     category: 'Textbooks',   status: 'active', seller_id: 'auth-uid-student-001' },
    { id: '2', title: 'Laptop',       asking_price: 8000, condition: 'like_new', category: 'Electronics', status: 'active', seller_id: 'auth-uid-student-002' },
  ];

  return {
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq:     jest.fn().mockReturnThis(),
        order:  jest.fn().mockResolvedValue({ data: mockListings, error: null }),
        single: jest.fn().mockResolvedValue({
          data: { id: 'new-id', title: 'New Item', asking_price: 500, status: 'active', seller_id: 'auth-uid-student-001' },
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

// ── US-05:Student posts a listing ─────────────────────────────────────

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

    test('Given a verified student session, when a listing is created, then sellerId comes from the session not the request body', async () => {
      // Simulates what the middleware chain does:
      // verifySession sets req.user
      // attachProfile sets req.profile
      // route handler uses req.profile.id as sellerId — never req.body
      const mockReqProfile = { id: 'profile-uuid-student-001', role: 'student' };

      const { data, error } = await createListing({
        sellerId: mockReqProfile.id, // ← from req.profile set by attachProfile middleware
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
      expect(data.seller_id).toBe('auth-uid-student-001');
    });
    test('Given a listing created by a student, when fetched, then seller_id matches a student profile', async () => {
      const { data } = await getActiveListings();
      // All listings in the mock are owned by student ids
      data.forEach((listing) => {
        expect(listing.seller_id).toMatch(/auth-uid-student/);
      });
    });    
  });

  describe('Role enforcement', () => {

    test('Given a facility_staff user, when they attempt to create a listing, then they are forbidden', async () => {
      const { requireRole } = require('../middleware/authMiddleware');
      const { supabase } = require('../config/supabaseClient');

      // Mock profile lookup returning facility_staff role
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'facility_staff' }, // ← facility staff cannot create listings
          error: null,
        }),
      }));

      const req = { user: { id: 'auth-uid-staff-001' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await requireRole('student')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('Given a student user, when they create a listing, then they are permitted', async () => {
      const { requireRole } = require('../middleware/authMiddleware');
      const { supabase } = require('../config/supabaseClient');

      // Mock profile lookup returning student role
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'student' }, // ← student can create listings
          error: null,
        }),
      }));

      const req = { user: { id: 'auth-uid-student-001' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await requireRole('student')(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

  });
 
});