const {supabase} = require('../config/supabaseClient');

/**
 * Fetches all active listings from the database.
 * Returns: { data: Listing[], error }
 */

const getActiveListings = async() =>{
    const { data, error } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      price: asking_price,
      condition,
      category,
      listing_type,
      status,
      created_at,
      seller_id
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Creates a new listing in the database.
 * Returns: { data: Listing, error }
 */

const createListing = async ({ sellerId, title, description, category, condition, askingPrice, listingType })=>{
    const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: sellerId,
      title,
      description,
      category,
      condition,
      asking_price: askingPrice,
      listing_type: listingType,
      status: 'active',
    })
    .select()
    .single();

    return { data, error };

};

module.exports = {getActiveListings, createListing};