// server/routes/listings.js
const express = require('express');
const router = express.Router();
const { getActiveListings, createListing } = require('../services/listingService');
const { getSuggestedPriceRange } = require('../services/cpiService');
const { validateListingInput } = require('../services/listingValidator');
const {verifySession, requireRole, attachProfile} = require('../middleware/authMiddleware');
const {validateListing} = require('../middleware/validateListing');
/**
 * GET /api/listings
 * Returns all active listings. Accessible to authenticated students.
 */
router.get('/', verifySession,attachProfile,async (req, res) => {
  const { data, error } = await getActiveListings();

  if (error) {
    return res.status(500).json({ message: 'Failed to fetch listings', error: error.message });
  }

  return res.status(200).json({ listings: data });
});


/**
 * GET /api/listings/suggested-price
 * Returns a suggested price range based on Stats SA CPI data.
 * Accessible to any authenticated user.
 * Query params: category, askingPrice
 */
router.get('/suggested-price', verifySession, attachProfile,(req, res) => {
  const { category, askingPrice } = req.query;

  if (!category || !askingPrice) {
    return res.status(400).json({ message: 'category and askingPrice are required' });
  }

  const price = parseFloat(askingPrice);

  if (isNaN(price) || price <= 0) {
    return res.status(400).json({ message: 'askingPrice must be a positive number' });
  }

  const suggestion = getSuggestedPriceRange(price, category);

  if (!suggestion) {
    return res.status(404).json({ message: `No CPI data available for category: ${category}` });
  }

  return res.status(200).json({ suggestion });
});

/**
 * POST /api/listings
 * Creates a new listing.
 * Accessible to students only.
 * Middleware chain:
 *   1. verifySession   — is the user signed in?
 *   2. attachProfile   — who are they? sets req.profile
 *   3. requireRole     — are they a student?
 *   4. validateListing — is the input valid? sets req.validatedListing
 *   5. handler         — just does the DB insert
 */
router.post(
  '/',
  verifySession,
  attachProfile,
  requireRole('student'),
  validateListing,
  async (req, res) => {
    const { data, error } = await createListing(req.validatedListing);

    if (error) {
      return res.status(500).json({ message: 'Failed to create listing', error: error.message });
    }

    return res.status(201).json({ listing: data });
  }
);

module.exports = router;
