// server/routes/listings.js
const express = require('express');
const router = express.Router();
const { getActiveListings, createListing } = require('../services/listingService');
const { validateListingInput } = require('../services/listingValidator');

/**
 * GET /api/listings
 * Returns all active listings. Accessible to authenticated students.
 */
router.get('/', async (req, res) => {
  const { data, error } = await getActiveListings();

  if (error) {
    return res.status(500).json({ message: 'Failed to fetch listings', error: error.message });
  }

  return res.status(200).json({ listings: data });
});

/**
 * POST /api/listings
 * Creates a new listing. Accessible to facility_staff only.
 */
router.post('/', async (req, res) => {
  const { title, description, category, condition, askingPrice, listingType } = req.body;
  const sellerId = req.body.sellerId;

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