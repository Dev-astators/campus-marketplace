const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const {
  verifySession,
  attachProfile,
} = require("../middleware/authMiddleware");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// SEND MESSAGE
router.post("/", verifySession, attachProfile, async (req, res) => {
  const { listing_id, receiver_id, content } = req.body;
  const sender_id = req.profile?.id;

  if (!content) {
    return res.status(400).json({ error: "Message content required" });
  }

  if (!listing_id || !receiver_id) {
    return res
      .status(400)
      .json({ error: "listing_id and receiver_id are required" });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert([{ listing_id, sender_id, receiver_id, content }])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: data[0] });
});

// GET MESSAGES FOR A LISTING BETWEEN 2 USERS
router.get(
  "/:listingId/:userA/:userB",
  verifySession,
  attachProfile,
  async (req, res) => {
    const { listingId, userA, userB } = req.params;

    if (
      String(req.profile?.id) !== String(userA) &&
      String(req.profile?.id) !== String(userB)
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this conversation" });
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("listing_id", listingId)
      .or(
        `and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`,
      )
      .order("sent_at", { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ messages: data });
  },
);

// GET ALL MESSAGES FOR A USER
router.get("/user/:userId", verifySession, attachProfile, async (req, res) => {
  const { userId } = req.params;

  if (String(req.profile?.id) !== String(userId)) {
    return res
      .status(403)
      .json({ error: "Not authorized to view these messages" });
  }

  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      *,
      listing:listings(title),
      sender:profiles!messages_sender_id_fkey(full_name),
      receiver:profiles!messages_receiver_id_fkey(full_name)
    `,
    )
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("sent_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ messages: data });
});

module.exports = router;
