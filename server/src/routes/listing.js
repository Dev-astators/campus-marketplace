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

/**
 * GET /api/listings
 * Returns all active listings. Accessible to authenticated students.
 */
router.get("/", async (req, res) => {
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
 * Returns active listings created by a specific seller.
 */
router.get("/my/:sellerId", async (req, res) => {
  const { sellerId } = req.params;

  if (!sellerId) {
    return res.status(400).json({ message: "sellerId is required" });
  }

  const { data, error } = await getListingsBySellerId(sellerId);

  if (error) {
    return res.status(500).json({
      message: "Failed to fetch seller listings",
      error: error.message,
    });
  }

  return res.status(200).json({ listings: data });
});

/**
 * POST /api/listings
 * Creates a new listing. Accessible to facility_staff only.
 */
router.post("/", async (req, res) => {
  const { title, description, category, condition, askingPrice, listingType } =
    req.body;
  const sellerId = req.body.sellerId;

  if (!sellerId) {
    return res.status(400).json({ message: "sellerId is required" });
  }

  const { valid, errors } = validateListingInput({
    title,
    category,
    condition,
    askingPrice,
    listingType,
  });

  if (!valid) {
    return res.status(400).json({ message: "Validation failed", errors });
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
    return res
      .status(500)
      .json({ message: "Failed to create listing", error: error.message });
  }

  return res.status(201).json({ listing: data });
});

// Get listing details by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        id,
        title,
        description,
        price: asking_price,
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
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("listings").delete().eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

// Update listing details from the owner edit form on ListingDetails page.
// Accepts the same editable fields shown in the client UI.
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const { title, description, askingPrice, category, condition, listingType } =
    req.body;

  const { valid, errors } = validateListingInput({
    title,
    category,
    condition,
    askingPrice,
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
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ listing: data });
});

// Add image to listing
router.post("/:id/images", async (req, res) => {
  const { id } = req.params;
  const { storage_path } = req.body;

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
