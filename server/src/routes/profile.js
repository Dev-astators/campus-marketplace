const express = require('express');
const router = express.Router();
const { verifySession, attachProfile } = require('../middleware/authMiddleware');

// Returns the authenticated user's profile (auto-created if missing).
router.get('/me', verifySession, attachProfile, (req, res) => {
  res.json({ profile: req.profile });
});

module.exports = router;
