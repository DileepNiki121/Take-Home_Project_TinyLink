 // routes/redirect.js
const express = require("express");
const router = express.Router();
const db = require("../db");

/*
  NEW VALIDATION RULES:
  - Allow letters, digits
  - Allow space, @, _, +, -, =, ., $, %, &, !
  - Length: 6–20 characters
  - BLOCK < > (XSS protection)
*/
const CODE_RE = /^[A-Za-z0-9 _@+\-=\.\$%&!]{6,30}$/;

/*
  Helper:
  - URL param arrives encoded (example: "%20" → " ")
  - decodeURIComponent() converts encoded URL text to normal text
  - trim() removes leading/trailing spaces
*/
function normalizeCode(raw) {
  try {
    if (!raw) return null;
    const decoded = decodeURIComponent(raw).trim();
    return decoded;
  } catch (err) {
    return null; // decode error → treat as invalid
  }
}

// ==============================
// REDIRECT LOGIC
// ==============================
router.get("/:code", async (req, res) => {
  // Decode URL param
  const rawCode = req.params.code;
  const code = normalizeCode(rawCode);

  // Validate final decoded code
  if (!code || !CODE_RE.test(code)) {
    return res.status(404).send("Invalid short code");
  }

  try {
    // Look up short code in database
    const r = await db.query(
      "SELECT target_url FROM links WHERE code = $1 LIMIT 1",
      [code]
    );

    // Not found → 404
    if (r.rowCount === 0) {
      return res.status(404).send("Short link not found");
    }

    const targetUrl = r.rows[0].target_url;

    // Update analytics (click count + last clicked)
    await db.query(
      "UPDATE links SET total_clicks = total_clicks + 1, last_clicked = NOW() WHERE code = $1",
      [code]
    );

    // Redirect the user to final URL
    return res.redirect(302, targetUrl);

  } catch (err) {
    console.error("Redirect error:", err);
    return res.status(500).send("Server error");
  }
});

module.exports = router;
