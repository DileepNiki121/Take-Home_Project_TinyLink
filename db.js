// db.js (safer)
const { Pool } = require('pg');
require('dotenv').config();



// convert env values and force types
const user = process.env.DB_USER || 'postgres';
//const password = String(process.env.DB_PASS || ''); // force string
const password = 'psql2026';
const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
const database = process.env.DB_NAME || 'Tinylink_db';

console.log('db config ->', { user, host, port, database, passwordType: typeof password });

const pool = new Pool({
  user,
  password,
  host,
  port,
  database
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
