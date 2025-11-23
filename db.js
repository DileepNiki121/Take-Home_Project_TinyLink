// db.js (safer)
const { Pool } = require('pg');
require('dotenv').config();

// --- Configuration Values ---
const user = process.env.DB_USER || 'postgres';
const password = String(process.env.DB_PASS || ''); 
const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
const database = process.env.DB_NAME || 'Tinylink_db';

// --- SSL Configuration for Render ---
// Render provides the DB credentials via environment variables.
// When running locally, DB_HOST is '127.0.0.1'.
// When running on Render, DB_HOST is the remote Neon host.
const isRender = process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1';

const sslConfig = isRender
  ? {
      // Use 'require' or 'prefer' for production environments
      // 'require' ensures the connection fails if SSL is not available/used, which is safer.
      rejectUnauthorized: false, 
      ssl: {
          rejectUnauthorized: false
      }
    }
  : false; // Do not use SSL locally

console.log('DB Connection Status:', isRender ? 'Using Remote Host (SSL Required)' : 'Using Local Host');

const pool = new Pool({
  user,
  password,
  host,
  port,
  database,
  // === APPLY THE SSL CONFIGURATION ===
  ssl: sslConfig, 
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};