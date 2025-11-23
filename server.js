// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");

const apiRoutes = require("./routes/api");
const redirectRoutes = require("./routes/redirect");

const app = express();

// Middleware: Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 1. Serve static files (e.g., app.js, CSS, etc.)
app.use(express.static(path.join(__dirname, "public")));

// ===================================================================
// 2. CRITICAL FIX: Serve index.html for the root path (THE DASHBOARD)
// This must come *before* redirectRoutes.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
// ===================================================================

// 3. API ROUTES (e.g., /api/links, /api/healthz)
app.use("/api", apiRoutes);

// 4. REDIRECT ROUTES (Must be the very last route to catch all remaining paths)
app.use("/", redirectRoutes);

const PORT = process.env.PORT || 8083;
app.listen(PORT, () => {
  console.log(`TinyLink server is running at http://localhost:${PORT}`);
});