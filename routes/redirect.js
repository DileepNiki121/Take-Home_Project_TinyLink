// routes/redirect.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Match valid short codes (6–8 alphanumeric)
const CODE_RE = /^[A-Za-z0-9]{6,8}$/;

// Redirect logic
router.get("/:code", async (req, res) => {
  const code = req.params.code;

  // Validate code format
  if (!CODE_RE.test(code)) {
    return res.status(404).send("Invalid short code");
  }

  try {
    // Find link by code
    const r = await db.query(
      "SELECT target_url FROM links WHERE code = $1",
      [code]
    );

    if (r.rowCount === 0) {
      return res.status(404).send("Short link not found");
    }

    const targetUrl = r.rows[0].target_url;

    // Update click count + last_clicked timestamp
    await db.query(
      "UPDATE links SET total_clicks = total_clicks + 1, last_clicked = NOW() WHERE code = $1",
      [code]
    );

    // Redirect user
    return res.redirect(302, targetUrl);

  } catch (err) {
    console.error("Redirect error:", err);
    return res.status(500).send("Server error");
  }
});

module.exports = router;
