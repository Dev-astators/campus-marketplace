// server/routes/listings.js
const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabaseClient");

const {
  getActiveListings,
  getListingsBySellerId,
  createListing,
} = require("../services/listingService");
const { validateListingInput } = require("../services/listingValidator");
const {
  verifySession,
  attachProfile,
  requireRole,
} = require("../middleware/authMiddleware");
const { validateListing } = require("../middleware/validateListing");
const { getSuggestedPriceRange } = require("../services/cpiService");

/**
 * GET /api/listings
 * Returns all active listings. Accessible to authenticated students.
 */
router.get("/", verifySession, attachProfile, async (req, res) => {
  const { data, error } = await getActiveListings();

  if (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch listings", error: error.message });
  }

  return res.status(200).json({ listings: data });
});

/**
 * GET /api/listings/my/:sellerId
 * Returns active listings created by the authenticated seller.
 * Auth is token-based (verifySession) and uses auth user id for authorization.
 */
router.get("/my/:sellerId", verifySession, attachProfile, async (req, res) => {
  const { sellerId } = req.params;
  const authenticatedProfileId = req.profile?.id;

  if (!sellerId) {
    return res.status(400).json({ message: "sellerId is required" });
  }

  if (!authenticatedProfileId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const isAuthorizedForSeller =
    String(sellerId) === String(authenticatedProfileId);

  if (!isAuthorizedForSeller) {
    return res.status(403).json({
      message: "You are not authorized to access another seller's listings",
    });
  }

  const { data, error } = await getListingsBySellerId(authenticatedProfileId);
  if (error) {
    return res.status(500).json({
      message: "Failed to fetch seller listings",
      error: error.message,
    });
  }

  return res.status(200).json({ listings: data || [] });
});

/**
 * POST /api/listings
 * Creates a new listing. Accessible to facility_staff only.
 */
router.post(
  "/",
  verifySession,
  attachProfile,
  requireRole("student"),
  validateListing,
  async (req, res) => {
    const { data, error } = await createListing(req.validatedListing);

    if (error) {
      return res
        .status(500)
        .json({ message: "Failed to create listing", error: error.message });
    }

    return res.status(201).json({ listing: data });
  },
);

/**
 * GET /api/listings/suggested-price
 * Returns a suggested price range based on Stats SA CPI data.
 * Accessible to any authenticated user.
 * Query params: category, askingPrice
 */
router.get("/suggested-price", verifySession, attachProfile, (req, res) => {
  const { category, askingPrice } = req.query;

  if (!category || !askingPrice) {
    return res
      .status(400)
      .json({ message: "category and askingPrice are required" });
  }

  const price = parseFloat(askingPrice);

  if (Number.isNaN(price) || price <= 0) {
    return res
      .status(400)
      .json({ message: "askingPrice must be a positive number" });
  }

  const suggestion = getSuggestedPriceRange(price, category);

  if (!suggestion) {
    return res
      .status(404)
      .json({ message: `No CPI data available for category: ${category}` });
  }

  return res.status(200).json({ suggestion });
});

// Get listing details by ID
router.get("/:id", verifySession, attachProfile, async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        id,
        title,
        description,
        asking_price,
        condition,
        category,
        listing_type,
        seller:profiles!listings_seller_id_fkey (
          id,
          full_name,
          average_rating,
          total_ratings
        ),
        listing_images (storage_path)
      `,
      )
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json({ listing: data[0] });
  } catch (err) {
    console.error("Server crash:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// For testing purposes, we can add a delete route to clear listings (not for production)
router.delete("/:id", verifySession, attachProfile, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("seller_id", req.profile.id)
    .select("id")
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ message: "Listing not found" });
  }

  res.json({ success: true });
});

// Update listing details from the owner edit form on ListingDetails page.
// Accepts the same editable fields shown in the client UI.
router.put("/:id", verifySession, attachProfile, async (req, res) => {
  const { id } = req.params;

  const { title, description, askingPrice, category, condition, listingType } =
    req.body;

  const { valid, errors } = validateListingInput({
    title,
    category,
    condition,
    askingPrice: parseFloat(askingPrice),
    listingType,
  });

  if (!valid) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const { data, error } = await supabase
    .from("listings")
    .update({
      title,
      description,
      asking_price: askingPrice,
      category,
      condition,
      listing_type: listingType,
    })
    .eq("id", id)
    .eq("seller_id", req.profile.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ listing: data });
});

// Add image to listing
router.post("/:id/images", verifySession, attachProfile, async (req, res) => {
  const { id } = req.params;
  const { storage_path } = req.body;

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, seller_id")
    .eq("id", id)
    .single();

  if (listingError || !listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  if (String(listing.seller_id) !== String(req.profile.id)) {
    return res
      .status(403)
      .json({ message: "Not authorized to edit this listing" });
  }

  const { data, error } = await supabase
    .from("listing_images")
    .insert({
      listing_id: id,
      storage_path,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ image: data });
});

module.exports = router;
