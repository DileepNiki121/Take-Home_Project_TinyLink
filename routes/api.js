// routes/api.js
const express = require("express");
const router = express.Router();
const db = require("../db");   // PostgreSQL connection

// REGEX to validate short code (6–8 characters)
const CODE_RE = /^[A-Za-z0-9]{6,10}$/;

// Validate URL using built-in URL class
function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (e) {
    return false;
  }
}

/* ===========================================================
   ROUTE: Create Link (CHANGED TO PUT)
   PUT /api/links
   Body: { target_url: "...", code?: "..." }
   =========================================================== */
router.put("/links", async (req, res) => { // <-- CHANGED from router.post
  const { target_url, code } = req.body;

  // Validate URL
  if (!target_url || !isValidUrl(target_url)) {
    return res.status(400).json({ error: "Invalid target_url" });
  }

  // Validate custom code (optional)
  if (code && !CODE_RE.test(code)) {
    return res.status(400).json({ error: "Code must be 6–8 alphanumeric" });
  }

  try {
    // If user provides custom code → check if it exists
    if (code) {
      const exists = await db.query(
        "SELECT 1 FROM links WHERE code=$1 LIMIT 1",
        [code]
      );

      if (exists.rowCount > 0) {
        return res.status(409).json({ error: "Code already exists" });
      }

      // Insert new link with custom code
      const r = await db.query(
        `INSERT INTO links (code, target_url)
         VALUES ($1, $2)
         RETURNING code, target_url, total_clicks, created_at, last_clicked`,
        [code, target_url]
      );

      return res.status(201).json(r.rows[0]);
    }

    /* ======================================================
       Auto-generate short code (6 chars)
       ====================================================== */
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let newCode;

    for (let i = 0; i < 20; i++) {
      newCode = Array.from({ length: 6 }, () => {
        return chars[Math.floor(Math.random() * chars.length)];
      }).join("");

      // Ensure no collision
      const exists = await db.query(
        "SELECT 1 FROM links WHERE code=$1 LIMIT 1",
        [newCode]
      );

      if (exists.rowCount === 0) break;
    }

    // Insert generated code
    const r = await db.query(
      `INSERT INTO links (code, target_url)
       VALUES ($1, $2)
       RETURNING code, target_url, total_clicks, created_at, last_clicked`,
      [newCode, target_url]
    );

    return res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error("Error creating link:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ===========================================================
   ROUTE: List All Links
   GET /api/links
   =========================================================== */
router.get("/links", async (req, res) => {
  try {
    const r = await db.query(
      `SELECT code, target_url, total_clicks, last_clicked, created_at
       FROM links
       ORDER BY created_at DESC`
    );
    return res.json(r.rows);
  } catch (err) {
    console.error("Error getting links:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ===========================================================
   ROUTE: Get Stats for a Link
   GET /api/links/:code
   =========================================================== */
router.get("/links/:code", async (req, res) => {
  const { code } = req.params;

  if (!CODE_RE.test(code)) {
    return res.status(400).json({ error: "Invalid code format" });
  }

  try {
    const r = await db.query(
      `SELECT code, target_url, total_clicks, last_clicked, created_at
       FROM links WHERE code=$1`,
      [code]
    );

    if (r.rowCount === 0) {
      return res.status(404).json({ error: "Link not found" });
    }

    return res.json(r.rows[0]);
  } catch (err) {
    console.error("Error fetching link stats:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ===========================================================
   ROUTE: Delete Link
   DELETE /api/links/:code
   =========================================================== */
router.delete("/links/:code", async (req, res) => {
  const { code } = req.params;

  if (!CODE_RE.test(code)) {
    return res.status(400).json({ error: "Invalid code format" });
  }

  try {
    const r = await db.query(
      `DELETE FROM links WHERE code=$1 RETURNING code`,
      [code]
    );

    if (r.rowCount === 0) {
      return res.status(404).json({ error: "Link not found" });
    }

    return res.status(204).send(); // 204 No Content (successful deletion)
  } catch (err) {
    console.error("Error deleting link:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ===========================================================
   ROUTE: Health Check (Required by Assignment)
   GET /api/healthz 
   =========================================================== */
router.get("/healthz", (req, res) => {
  // Returns a simple 200 OK status
  return res.json({ ok: true, version: "1.0" });
});


module.exports = router;