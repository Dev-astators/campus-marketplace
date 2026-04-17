// server/routes/listings.js
const express = require('express');
const router = express.Router();
const { getActiveListings, createListing } = require('../services/listingService');
const { validateListingInput } = require('../services/listingValidator');
const {verifySession, requireRole} = require('../middleware/authMiddleware');

/**
 * GET /api/listings
 * Returns all active listings. Accessible to authenticated students.
 */
router.get('/', verifySession,async (req, res) => {
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
router.get('/suggested-price', verifySession, (req, res) => {
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
 * Creates a new listing. Accessible to facility_staff only.
 */
router.post('/',verifySession, requireRole('facility_staff') ,async (req, res) => {
  const { title, description, category, condition, askingPrice, listingType } = req.body;
  const sellerId = req.user.id;

  if (!sellerId) {
    return res.status(400).json({ message: 'sellerId is required' });
  }

  const { valid, errors } = validateListingInput({ title, category, condition, askingPrice, listingType });

  if (!valid) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const { data, error } = await createListing({
    sellerId,
    title,
    description,
    category,
    condition,
    askingPrice,
    listingType,
  });

  if (error) {
    return res.status(500).json({ message: 'Failed to create listing', error: error.message });
  }

  return res.status(201).json({ listing: data });
});

module.exports = router;