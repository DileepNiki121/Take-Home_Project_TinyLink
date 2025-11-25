// db.js
//
// This file creates and exports a PostgreSQL connection pool.
// It uses environment variables so it works in BOTH:
//   1. Local development (localhost PostgreSQL or Neon)
//   2. Render deployment (Neon remote DB with SSL)
// ----------------------------------------------------------

const { Pool } = require('pg');
require('dotenv').config();     // Load .env (local) — ignored in Render

// -------------------------------
//  ENVIRONMENT VARIABLES
// -------------------------------
//
// These MUST be set in Render’s Environment tab:
//   DB_HOST       = your Neon host
//   DB_PORT       = 5432
//   DB_USER       = neondb_owner
//   DB_PASSWORD   = your actual Neon password
//   DB_NAME       = neondb
//
// Locally, these come from your .env file.

const user = process.env.DB_USER;                                      // DB username
const password = process.env.DB_PASSWORD || process.env.DB_PASS;       // DB password
const host = process.env.DB_HOST;                                      // DB hostname
const port = Number(process.env.DB_PORT || 5432);                      // DB port
const database = process.env.DB_NAME;                                  // DB name

// ----------------------------------------
// DETECT IF WE SHOULD USE SSL (NEON DB)
// ----------------------------------------
//
// Neon (remote server) requires SSL.
// Localhost does NOT.
//
// If DB_HOST is not localhost → use SSL.

const usingLocalHost =
  host === '127.0.0.1' ||
  host === 'localhost' ||
  host === undefined ||
  host === null;

const poolConfig = {
  user,
  password,
  host,
  port,
  database,
  ssl: usingLocalHost
    ? false                                // Local mode → NO SSL
    : { rejectUnauthorized: false }        // Render + Neon → SSL REQUIRED
};

// Create the connection pool
const pool = new Pool(poolConfig);

// ----------------------------------------
// OPTIONAL: Debug output
// ----------------------------------------
console.log('--------------------------------');
console.log('DATABASE CONNECTION SETTINGS:');
console.log(`HOST      : ${host}`);
console.log(`DATABASE  : ${database}`);
console.log(`USER      : ${user}`);
console.log(`SSL MODE  : ${usingLocalHost ? 'LOCAL (no SSL)' : 'NEON (SSL enabled)'}`);
console.log('--------------------------------');

// ----------------------------------------
// EXPORT QUERY FUNCTION
// ----------------------------------------
//
// Use db.query(sql, params) anywhere in your app.
// Example:
//    const result = await db.query('SELECT * FROM links');
//
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
