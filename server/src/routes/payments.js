// server/src/routes/payments.js
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const {
  buildPaymentPayload,
  verifyITN,
} = require("../services/payfastService");

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const IS_SANDBOX = process.env.PAYFAST_SANDBOX === "true";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/initiate
// Creates a pending transaction — listing stays "active" until payment confirms
// ─────────────────────────────────────────────────────────────────────────────
router.post("/initiate", async (req, res) => {
  const { listingId, buyerId, onlineAmount } = req.body;

  if (!listingId || !buyerId) {
    return res
      .status(400)
      .json({ error: "listingId and buyerId are required." });
  }

  try {
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, asking_price, seller_id, status")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return res.status(404).json({ error: "Listing not found." });
    }
    if (listing.status !== "active") {
      return res
        .status(400)
        .json({ error: "This listing is no longer available." });
    }
    if (listing.seller_id === buyerId) {
      return res
        .status(400)
        .json({ error: "You cannot buy your own listing." });
    }

    const { data: buyer, error: buyerError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", buyerId)
      .single();

    if (buyerError || !buyer) {
      return res.status(404).json({ error: "Buyer profile not found." });
    }

    // If buyer specified a partial online amount, use it — otherwise pay full price
    const totalPrice = Number(listing.asking_price);
    const payOnline = onlineAmount
      ? Math.min(Math.max(Number(onlineAmount), 1), totalPrice) // clamp between R1 and full price
      : totalPrice;
    const cashShortfall = Number((totalPrice - payOnline).toFixed(2));

    if (payOnline < 1) {
      return res
        .status(400)
        .json({ error: "Online payment must be at least R1.00." });
    }

    // Create transaction (pending) — listing stays active until payment confirms
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        online_amount: payOnline,
        cash_shortfall: cashShortfall,
        cash_settled: cashShortfall === 0, // auto-settled if no shortfall
        status: "pending",
      })
      .select("id")
      .single();

    if (txError) throw txError;

    const { error: paymentError } = await supabase.from("payments").insert({
      transaction_id: transaction.id,
      amount: payOnline,
      payment_type: "online",
      status: "pending",
    });

    if (paymentError) throw paymentError;

    const [firstName, ...rest] = buyer.full_name.split(" ");
    const lastName = rest.join(" ") || "-";

    const payfast = buildPaymentPayload({
      transactionId: transaction.id,
      amount: payOnline, // only the online portion goes to PayFast
      itemName: listing.title,
      buyerFirstName: firstName,
      buyerLastName: lastName,
      buyerEmail: buyer.email,
    });

    return res.json({
      transactionId: transaction.id,
      cashShortfall, // so the frontend can show the buyer what to pay in cash
      payfast,
    });
  } catch (err) {
    console.error("Payment initiate error:", err);
    return res.status(500).json({ error: "Failed to initiate payment." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/webhook  (production ITN from PayFast)
// Sets listing → "reserved" and transaction → "confirmed" on payment success
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/webhook",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    res.sendStatus(200); // always respond immediately

    const itnData = req.body;

    try {
      if (!verifyITN(itnData)) {
        console.warn("PayFast ITN: invalid signature or incomplete payment.");
        return;
      }

      await confirmPayment(itnData.m_payment_id, itnData.pf_payment_id);
    } catch (err) {
      console.error("PayFast webhook error:", err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/confirm-dev  (sandbox / dev only)
// Manually confirm a payment without needing ITN webhook
// Remove or disable this before going live
// ─────────────────────────────────────────────────────────────────────────────
router.post("/confirm-dev", async (req, res) => {
  if (!IS_SANDBOX) {
    return res.status(403).json({ error: "Not available in production." });
  }

  const { transactionId } = req.body;
  if (!transactionId) {
    return res.status(400).json({ error: "transactionId is required." });
  }

  try {
    await confirmPayment(transactionId, "sandbox-manual");
    return res.json({ ok: true, message: "Transaction confirmed manually." });
  } catch (err) {
    console.error("confirm-dev error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Shared confirm logic — used by both webhook and confirm-dev
// ✅ Sets listing → "reserved" AFTER payment is confirmed
// ─────────────────────────────────────────────────────────────────────────────
async function confirmPayment(transactionId, gatewayRef) {
  // 1. Fetch transaction with listing + buyer + seller details
  const { data: tx, error: txFetchError } = await supabase
    .from("transactions")
    .select(
      `
      id, listing_id,
      listings ( title ),
      buyer:profiles!transactions_buyer_id_fkey ( id, full_name ),
      seller:profiles!transactions_seller_id_fkey ( id, full_name )
    `,
    )
    .eq("id", transactionId)
    .single();

  if (txFetchError || !tx) throw new Error("Transaction not found.");

  // 2. Mark payment as success
  await supabase
    .from("payments")
    .update({
      status: "success",
      gateway_ref: gatewayRef,
      paid_at: new Date().toISOString(),
    })
    .eq("transaction_id", transactionId);

  // 3. Mark transaction as confirmed
  await supabase
    .from("transactions")
    .update({ status: "confirmed" })
    .eq("id", transactionId);

  // 4. Set listing to "reserved" now that payment is confirmed
  await supabase
    .from("listings")
    .update({ status: "reserved" })
    .eq("id", tx.listing_id);

  // 5. Fetch the buyer's collection booking for the notification message
  const { data: booking } = await supabase
    .from("facility_bookings")
    .select("slot_id, facility_slots ( slot_date, slot_time )")
    .eq("transaction_id", transactionId)
    .eq("booking_type", "collection")
    .single();

  const collectionDate = booking?.facility_slots?.slot_date
    ? new Date(booking.facility_slots.slot_date).toDateString()
    : "TBD";
  const collectionTime =
    booking?.facility_slots?.slot_time?.slice(0, 5) || "TBD";

  // 6. Create in-app notification for the seller
  await supabase.from("notifications").insert({
    user_id: tx.seller.id,
    title: "Your item was sold!",
    message: `${tx.buyer.full_name} bought "${tx.listings.title}". Book your drop-off slot before ${collectionDate} at ${collectionTime}.`,
    type: "sale",
    related_transaction_id: transactionId,
    is_read: false,
  });

  // in-app notification inserted above — no further action needed
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/status/:transactionId
// ─────────────────────────────────────────────────────────────────────────────
router.get("/status/:transactionId", async (req, res) => {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, status, listing_id, online_amount")
    .eq("id", req.params.transactionId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Transaction not found." });
  }
  return res.json(data);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/facilities
// Returns all active trade facilities for the student to choose from
// ─────────────────────────────────────────────────────────────────────────────
router.get("/facilities", async (req, res) => {
  const { data, error } = await supabase
    .from("trade_facilities")
    .select("id, name, location, operating_hours")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/slots/:facilityId
// ?type=collection → buyer: slots from tomorrow onwards (gives seller time to drop off)
// ?type=drop_off   → seller: slots from today onwards
// ─────────────────────────────────────────────────────────────────────────────
router.get("/slots/:facilityId", async (req, res) => {
  const { type = "collection" } = req.query;

  // Buyer collection slots start tomorrow — ensures seller always has time to drop off first
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const minDate =
    type === "drop_off"
      ? today.toISOString().split("T")[0] // seller: from today
      : tomorrow.toISOString().split("T")[0]; // buyer:  from tomorrow

  const { data, error } = await supabase
    .from("facility_slots")
    .select("id, slot_date, slot_time, capacity, booked_count")
    .eq("facility_id", req.params.facilityId)
    .gte("slot_date", minDate)
    .order("slot_date", { ascending: true })
    .order("slot_time", { ascending: true })
    .limit(30);

  if (error) return res.status(500).json({ error: error.message });

  const slots = data || [];
  if (slots.length === 0) return res.json([]);

  const slotIds = slots.map((slot) => slot.id);
  const { data: bookingRows, error: bookingsError } = await supabase
    .from("facility_bookings")
    .select("slot_id")
    .in("slot_id", slotIds);

  if (bookingsError)
    return res.status(500).json({ error: bookingsError.message });

  const bookedBySlot = slotIds.reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {});

  (bookingRows || []).forEach((row) => {
    if (bookedBySlot[row.slot_id] !== undefined) bookedBySlot[row.slot_id] += 1;
  });

  const available = slots
    .map((slot) => ({
      ...slot,
      booked_count: bookedBySlot[slot.id] ?? 0,
    }))
    .filter((slot) => slot.booked_count < slot.capacity);

  return res.json(available);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/book-slot
// ─────────────────────────────────────────────────────────────────────────────
router.post("/book-slot", async (req, res) => {
  const { transactionId, slotId, studentId, bookingType } = req.body;

  if (!transactionId || !slotId || !studentId || !bookingType) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const { data: tx } = await supabase
      .from("transactions")
      .select("id, status, buyer_id")
      .eq("id", transactionId)
      .single();

    if (!tx || tx.status !== "confirmed") {
      return res
        .status(400)
        .json({ error: "Payment must be confirmed before booking a slot." });
    }

    if (bookingType !== "collection") {
      return res
        .status(400)
        .json({ error: "Only collection bookings are allowed here." });
    }

    if (tx.buyer_id !== studentId) {
      return res
        .status(403)
        .json({ error: "Only the buyer can book a collection slot." });
    }

    const { data: existingBooking } = await supabase
      .from("facility_bookings")
      .select("id")
      .eq("transaction_id", transactionId)
      .eq("booking_type", bookingType)
      .maybeSingle();

    if (existingBooking) {
      return res
        .status(400)
        .json({
          error: "A collection slot is already booked for this transaction.",
        });
    }

    const { data: slot } = await supabase
      .from("facility_slots")
      .select("capacity")
      .eq("id", slotId)
      .single();

    const { count, error: countError } = await supabase
      .from("facility_bookings")
      .select("id", { count: "exact", head: true })
      .eq("slot_id", slotId);

    if (countError) throw countError;
    if (slot && Number(count || 0) >= Number(slot.capacity || 0)) {
      return res.status(400).json({ error: "Selected slot is full." });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("facility_bookings")
      .insert({
        transaction_id: transactionId,
        slot_id: slotId,
        student_id: studentId,
        booking_type: bookingType,
        status: "pending",
      })
      .select("id")
      .single();

    if (bookingError) throw bookingError;

    // booked_count is incremented automatically by the DB trigger on_booking_insert
    return res.json({ bookingId: booking.id });
  } catch (err) {
    console.error("Slot booking error:", err);
    return res.status(500).json({ error: "Failed to book slot." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/my-purchases/:profileId
// Buyer sees all their transactions with booking and listing details
// ─────────────────────────────────────────────────────────────────────────────
router.get("/my-purchases/:profileId", async (req, res) => {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      id, status, online_amount, cash_shortfall, cash_settled, created_at,
      listings ( id, title, listing_images ( storage_path, display_order ) ),
      seller:profiles!transactions_seller_id_fkey ( id, full_name, average_rating ),
      facility_bookings (
        id, booking_type, status, confirmed_at,
        facility_slots ( slot_date, slot_time ),
        trade_facilities:facility_slots ( facility_id )
      )
    `,
    )
    .eq("buyer_id", req.params.profileId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/my-sales/:profileId
// Seller sees all their sales with buyer booking info so they can book drop-off
// ─────────────────────────────────────────────────────────────────────────────
router.get("/my-sales/:profileId", async (req, res) => {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      id, status, online_amount, created_at,
      listings ( id, title, listing_images ( storage_path, display_order ) ),
      buyer:profiles!transactions_buyer_id_fkey ( id, full_name, email ),
      facility_bookings (
        id, booking_type, status, confirmed_at,
        facility_slots ( slot_date, slot_time, facility_id,
          trade_facilities ( id, name, location )
        )
      )
    `,
    )
    .eq("seller_id", req.params.profileId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/book-dropoff
// Seller books a drop-off slot (must be at same facility as buyer collection)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/book-dropoff", async (req, res) => {
  const { transactionId, slotId, sellerId } = req.body;

  if (!transactionId || !slotId || !sellerId) {
    return res
      .status(400)
      .json({ error: "transactionId, slotId and sellerId are required." });
  }

  try {
    // Verify transaction is confirmed
    const { data: tx } = await supabase
      .from("transactions")
      .select("id, status, seller_id")
      .eq("id", transactionId)
      .single();

    if (!tx || tx.status !== "confirmed") {
      return res
        .status(400)
        .json({
          error: "Transaction must be confirmed before booking drop-off.",
        });
    }

    if (tx.seller_id !== sellerId) {
      return res
        .status(403)
        .json({
          error: "Only the seller can book a drop-off for this transaction.",
        });
    }

    // Prevent duplicate drop-off bookings
    const { data: existing } = await supabase
      .from("facility_bookings")
      .select("id")
      .eq("transaction_id", transactionId)
      .eq("booking_type", "drop_off")
      .maybeSingle();

    if (existing) {
      return res
        .status(400)
        .json({
          error: "A drop-off slot is already booked for this transaction.",
        });
    }

    const { data: collection } = await supabase
      .from("facility_bookings")
      .select("facility_slots ( facility_id )")
      .eq("transaction_id", transactionId)
      .eq("booking_type", "collection")
      .maybeSingle();

    const collectionFacilityId = collection?.facility_slots?.facility_id;
    if (!collectionFacilityId) {
      return res
        .status(400)
        .json({ error: "Buyer must book a collection slot before drop-off." });
    }

    const { data: slot } = await supabase
      .from("facility_slots")
      .select("facility_id")
      .eq("id", slotId)
      .single();

    if (slot?.facility_id !== collectionFacilityId) {
      return res.status(400).json({
        error:
          "Drop-off must be at the same facility as the buyer's collection.",
      });
    }

    // Create drop-off booking
    const { data: booking, error: bookingError } = await supabase
      .from("facility_bookings")
      .insert({
        transaction_id: transactionId,
        slot_id: slotId,
        student_id: sellerId,
        booking_type: "drop_off",
        status: "pending",
      })
      .select("id")
      .single();

    if (bookingError) throw bookingError;

    // booked_count is incremented automatically by the DB trigger on_booking_insert

    // Notify buyer that seller has booked drop-off
    const { data: txFull } = await supabase
      .from("transactions")
      .select(
        `
        buyer_id,
        listings ( title ),
        seller:profiles!transactions_seller_id_fkey ( full_name )
      `,
      )
      .eq("id", transactionId)
      .single();

    if (txFull) {
      const { data: slot } = await supabase
        .from("facility_slots")
        .select("slot_date, slot_time")
        .eq("id", slotId)
        .single();

      await supabase.from("notifications").insert({
        user_id: txFull.buyer_id,
        title: "Seller booked drop-off",
        message: `${txFull.seller.full_name} will drop off "${txFull.listings.title}" on ${new Date(slot.slot_date).toDateString()} at ${slot.slot_time.slice(0, 5)}.`,
        type: "dropoff",
        related_transaction_id: transactionId,
        is_read: false,
      });
    }

    return res.json({ bookingId: booking.id });
  } catch (err) {
    console.error("Drop-off booking error:", err);
    return res.status(500).json({ error: "Failed to book drop-off slot." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/notifications/:profileId
// Fetch unread notifications for a user
// ─────────────────────────────────────────────────────────────────────────────
router.get("/notifications/:profileId", async (req, res) => {
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, title, message, type, is_read, created_at, related_transaction_id",
    )
    .eq("user_id", req.params.profileId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/payments/notifications/:notificationId/read
// Mark a notification as read
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/notifications/:notificationId/read", async (req, res) => {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", req.params.notificationId);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

module.exports = router;
