// server/services/listingValidator.js

// Keep category validation aligned with client listing form/filter options.
const VALID_CATEGORIES = ["Textbooks", "Electronics", "Furniture", "Clothing"];
const VALID_CONDITIONS = ["new", "like_new", "good", "fair", "poor"];
const VALID_LISTING_TYPES = ["sale", "trade", "both"];

/**
 * Validates a listing payload before insertion.
 * Returns: { valid: boolean, errors: string[] }
 */
const validateListingInput = ({
  title,
  category,
  condition,
  askingPrice,
  listingType,
}) => {
  const errors = [];

  if (!title || typeof title !== "string" || title.trim() === "") {
    errors.push("title is required");
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }

  if (!condition || !VALID_CONDITIONS.includes(condition)) {
    errors.push(`condition must be one of: ${VALID_CONDITIONS.join(", ")}`);
  }

  if (askingPrice === undefined || askingPrice === null) {
    errors.push("asking_price is required");
  } else if (typeof askingPrice !== "number" || askingPrice <= 0) {
    errors.push("asking_price must be a positive number");
  }

  if (!listingType || !VALID_LISTING_TYPES.includes(listingType)) {
    errors.push(
      `listing_type must be one of: ${VALID_LISTING_TYPES.join(", ")}`,
    );
  }

  return { valid: errors.length === 0, errors };
};

module.exports = {
  validateListingInput,
  VALID_CATEGORIES,
  VALID_CONDITIONS,
  VALID_LISTING_TYPES,
};
