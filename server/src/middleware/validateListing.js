// server/src/middleware/validateListing.js
const { validateListingInput } = require('../services/listingValidator');

/**
 * validateListing middleware
 * Validates the listing payload from req.body before it reaches the route handler.
 * Attaches the validated and sanitised listing data to req.validatedListing
 * so the route handler never touches req.body directly.
 *
 * Must be used AFTER attachProfile since it uses req.profile.id as sellerId.
 *
 * Responds with:
 *   400 — if any required field is missing or invalid
 */

const validateListing = (req, res, next) => {
  try {
    const { title, description, category, condition, askingPrice, listingType } = req.body;

    // Run validation
    const { valid, errors } = validateListingInput({
      title,
      category,
      condition,
      askingPrice: parseFloat(askingPrice),
      listingType,
    });

    if (!valid) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Attach sanitised listing to request
    // sellerId always comes from req.profile — never from req.body
    req.validatedListing = {
      sellerId: req.profile.id,
      title: title.trim(),
      description: description?.trim() || null,
      category,
      condition,
      askingPrice: parseFloat(askingPrice),
      listingType,
    };

    next();

  } catch (err) {
    return res.status(500).json({ message: 'Internal server error during listing validation' });
  }
};

module.exports = { validateListing };