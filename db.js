// db.js (fixed)
// Load dotenv from the same folder as this file (robust on Windows/OneDrive)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { Pool } = require('pg');

// --- Read config from environment (use DB_PASSWORD, not DB_PASS) ---
const user = process.env.DB_USER || 'postgres';
const passwordEnv = process.env.DB_PASSWORD;           // <-- correct variable name
const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
const database = process.env.DB_NAME || 'Tinylink_db';

// --- Safety check: require a non-empty password so pg won't throw SCRAM error ---
if (!passwordEnv || passwordEnv.trim() === '') {
  console.error('\n✖ ERROR: DB_PASSWORD is not set in .env or is empty.');
  console.error('Please add DB_PASSWORD=your_postgres_password to your .env and restart the server.\n');
  // Exit early to avoid confusing SCRAM errors. Remove this line if you prefer to continue without exiting.
  process.exit(1);
}
const password = String(passwordEnv);

// --- SSL configuration (simple and correct) ---
const isRender = process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost';
const sslConfig = isRender ? { rejectUnauthorized: false } : false;

console.log('DB Connection Status:', isRender ? 'Using Remote Host (SSL Required)' : 'Using Local Host');

const pool = new Pool({
  user,
  password,
  host,
  port,
  database,
  ssl: sslConfig,
});

// Optional: test a connection and print a helpful message
pool.connect()
  .then(client => {
    client.release();
    console.log('DB Connection: OK');
  })
  .catch(err => {
    console.error('DB Connection Error:', err.message || err);
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
