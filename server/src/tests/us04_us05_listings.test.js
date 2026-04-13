const {validateListingInput} = require('../services/listingValidator');
const { getActiveListings, createListing } = require('../services/listingService');

// ── Mock Supabase ─────────────────────────────────────────────────────────────

jest.mock('../../src/config/supabaseClient', () => {
  const mockListings = [
    { id: '1', title: 'CS Textbook', asking_price: 200, condition: 'good', category: 'Textbooks', status: 'active', seller_id: 'seller-001' },
    { id: '2', title: 'Laptop',      asking_price: 8000, condition: 'like_new', category: 'Electronics', status: 'active', seller_id: 'seller-001' },
  ];

  return {
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq:     jest.fn().mockReturnThis(),
        order:  jest.fn().mockResolvedValue({ data: mockListings, error: null }),
        single: jest.fn().mockResolvedValue({
          data: { id: 'new-id', title: 'New Item', asking_price: 500, status: 'active' },
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

    test('Given valid input, when a facility staff member submits the form, then the listing is created successfully', async () => {
      const { data, error } = await createListing({
        sellerId: 'seller-001',
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
    });

  });

});
