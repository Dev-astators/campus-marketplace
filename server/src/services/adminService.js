const { supabase } = require("../config/supabaseClient");

// ─── Summary cards ────────────────────────────────────────────────────────────

const getAdminSummary = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { count: activeListings, error: e1 },
    { count: flaggedListings, error: e2 },
    { count: flaggedReviews, error: e3 },
    { count: transactions30d, error: e4 },
    { data: slots, error: e5 },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("is_flagged", true),
    supabase
      .from("ratings")
      .select("*", { count: "exact", head: true })
      .eq("is_flagged", true),
    supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("facility_slots").select("capacity, booked_count"),
  ]);

  const firstError = [e1, e2, e3, e4, e5].find(Boolean);
  if (firstError) return { data: null, error: firstError };

  const totalCapacity = (slots || []).reduce(
    (sum, s) => sum + Number(s.capacity || 0),
    0,
  );
  const totalBooked = (slots || []).reduce(
    (sum, s) => sum + Number(s.booked_count || 0),
    0,
  );
  const utilizationPct =
    totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

  return {
    data: {
      activeListings: activeListings || 0,
      pendingModeration: (flaggedListings || 0) + (flaggedReviews || 0),
      utilizationPct,
      utilizationBooked: totalBooked,
      utilizationCapacity: totalCapacity,
      transactions30d: transactions30d || 0,
    },
    error: null,
  };
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const getAdminAnalytics = async () => {
  const [
    { data: listings, error: e1 },
    { data: transactions, error: e2 },
    { data: slots, error: e3 },
    { count: flaggedListings },
    { count: flaggedReviews },
  ] = await Promise.all([
    supabase.from("listings").select("category"),
    supabase
      .from("transactions")
      .select("created_at, status")
      .order("created_at", { ascending: true }),
    supabase.from("facility_slots").select("capacity, booked_count"),
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("is_flagged", true),
    supabase
      .from("ratings")
      .select("*", { count: "exact", head: true })
      .eq("is_flagged", true),
  ]);

  const firstError = [e1, e2, e3].find(Boolean);
  if (firstError) return { data: null, error: firstError };

  // Aggregate categories
  const categoryCounts = (listings || []).reduce((acc, l) => {
    if (l.category) acc[l.category] = (acc[l.category] || 0) + 1;
    return acc;
  }, {});
  const popularCategories = Object.entries(categoryCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Aggregate transactions by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthMap = new Map();
  (transactions || [])
    .filter((tx) => new Date(tx.created_at) >= sixMonthsAgo)
    .forEach((tx) => {
      const d = new Date(tx.created_at);
      const key = d.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    });
  const transactionsOverTime = Array.from(monthMap.entries()).map(
    ([label, count]) => ({ label, count }),
  );

  const totalCapacity = (slots || []).reduce(
    (sum, s) => sum + Number(s.capacity || 0),
    0,
  );
  const totalBooked = (slots || []).reduce(
    (sum, s) => sum + Number(s.booked_count || 0),
    0,
  );

  return {
    data: {
      popularCategories,
      transactionsOverTime,
      facilityUtilization: { booked: totalBooked, capacity: totalCapacity },
      flaggedSummary: {
        listings: flaggedListings || 0,
        reviews: flaggedReviews || 0,
        messages: 0,
      },
    },
    error: null,
  };
};

// ─── Moderation ───────────────────────────────────────────────────────────────

const getModerationQueue = async () => {
  const [
    { data: flaggedListings, error: e1 },
    { data: flaggedReviews, error: e2 },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, title, created_at, seller:profiles!listings_seller_id_fkey(full_name)",
      )
      .eq("is_flagged", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("ratings")
      .select(
        `id, score, review_text, created_at,
         reviewer:profiles!ratings_reviewer_id_fkey(full_name),
         transaction:transactions(listing:listings(title))`,
      )
      .eq("is_flagged", true)
      .order("created_at", { ascending: false }),
  ]);

  if (e1 || e2) return { data: null, error: e1 || e2 };

  return {
    data: {
      flaggedListings: (flaggedListings || []).map((l) => ({
        id: l.id,
        title: l.title,
        reason: "Flagged for review",
        reportedBy: l.seller?.full_name || "Unknown",
      })),
      flaggedReviews: (flaggedReviews || []).map((r) => ({
        id: r.id,
        listing: r.transaction?.listing?.title || "Unknown listing",
        reason: "Abusive or inappropriate content",
        reportedBy: r.reviewer?.full_name || "Unknown",
      })),
    },
    error: null,
  };
};

const resolveListingFlag = async (listingId) => {
  const { error } = await supabase
    .from("listings")
    .update({ is_flagged: false })
    .eq("id", listingId);
  return { error };
};

const resolveReviewFlag = async (reviewId) => {
  const { error } = await supabase
    .from("ratings")
    .update({ is_flagged: false })
    .eq("id", reviewId);
  return { error };
};

// ─── User management ─────────────────────────────────────────────────────────

const VALID_ROLES = ["student", "facility_staff", "admin"];

const getAllUsers = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, student_number, university, role, average_rating, total_ratings, created_at",
    )
    .order("created_at", { ascending: false });

  return { data, error };
};

const updateUserRole = async (userId, newRole) => {
  if (!VALID_ROLES.includes(newRole)) {
    return {
      data: null,
      error: new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`),
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId)
    .select("id, full_name, email, role")
    .single();

  return { data, error };
};

// ─── Facility settings ────────────────────────────────────────────────────────

const getFacilities = async () => {
  const { data, error } = await supabase
    .from("trade_facilities")
    .select("*")
    .order("name", { ascending: true });

  return { data, error };
};

const upsertFacility = async (facilityData) => {
  const payload = {
    name: facilityData.name,
    location: facilityData.location,
    slot_capacity: Number(facilityData.slotCapacity),
    is_active: Boolean(facilityData.isActive),
    operating_hours: facilityData.operatingHours,
  };

  if (facilityData.id) {
    const { data, error } = await supabase
      .from("trade_facilities")
      .update(payload)
      .eq("id", facilityData.id)
      .select()
      .single();
    return { data, error };
  }

  const { data, error } = await supabase
    .from("trade_facilities")
    .insert(payload)
    .select()
    .single();
  return { data, error };
};

module.exports = {
  getAdminSummary,
  getAdminAnalytics,
  getModerationQueue,
  resolveListingFlag,
  resolveReviewFlag,
  getAllUsers,
  updateUserRole,
  getFacilities,
  upsertFacility,
};