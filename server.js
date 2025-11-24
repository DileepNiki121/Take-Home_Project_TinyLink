// =======================================================
// Load environment variables FIRST (with explicit file path)
// =======================================================
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

// Debug logs to verify dotenv is working
console.log("cwd:", process.cwd());
console.log("__dirname:", __dirname);
console.log(
  "DB_PASSWORD from env:",
  process.env.DB_PASSWORD ? "[SET]" : "[NOT SET]"
);

// =======================================================
// App imports
// =======================================================
const express = require("express");

const apiRoutes = require("./routes/api");
const redirectRoutes = require("./routes/redirect");

const app = express();

// Middleware: Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 1. Serve static files (app.js, CSS, etc.)
app.use(express.static(path.join(__dirname, "public")));

// =======================================================
// 2. Serve index.html for root `/` (Dashboard)
// =======================================================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 3. API Routes
app.use("/api", apiRoutes);

// 4. Redirect Routes (must be last)
app.use("/", redirectRoutes);

// Start server
const PORT = process.env.PORT || 8083;
app.listen(PORT, () => {
  console.log(`TinyLink server is running at http://localhost:${PORT}`);
});
