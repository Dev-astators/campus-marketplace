const { supabase } = require("../config/supabaseClient");

/**
 * Fetches all active listings from the database.
 * Returns: { data: Listing[], error }
 */

const getActiveListings = async () => {
  // Description is selected so client keyword search can match title and description.
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
      status,
      created_at,
      seller_id,
      listing_images (storage_path)
    `,
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return { data, error };
};

/**
 * Fetches active listings for a specific seller.
 * Returns: { data: Listing[], error }
 */
const getListingsBySellerId = async (sellerId) => {
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
      status,
      created_at,
      seller_id,
      listing_images (storage_path)
    `,
    )
    // My Listings tab should only show listings created by the signed-in seller.
    .eq("status", "active")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  return { data, error };
};

/**
 * Creates a new listing in the database.
 * Returns: { data: Listing, error }
 */

const createListing = async ({
  sellerId,
  title,
  description,
  category,
  condition,
  askingPrice,
  listingType,
  images = [],
}) => {
  // 1. Create listing
  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      seller_id: sellerId,
      title,
      description,
      category,
      condition,
      asking_price: askingPrice,
      listing_type: listingType,
      status: "active",
    })
    .select()
    .single();

  if (error) return { data: null, error };

  // 2. Insert images
  if (images.length > 0) {
    const imageRows = images.map((path, index) => ({
      listing_id: listing.id,
      storage_path: path,
      display_order: index,
    }));

    const { error: imageError } = await supabase
      .from("listing_images")
      .insert(imageRows);
    if (imageError) return { data: null, error: imageError };
  }

  return { data: listing, error: null };
};

module.exports = { getActiveListings, getListingsBySellerId, createListing };
