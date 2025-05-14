import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import process from 'process';

const { Pool } = pg;
dotenv.config();

console.log('Initializing database connection...');
console.log('Database URL format check:', process.env.DATABASE_URL ? 'URL exists' : 'URL missing');

// Check if certificate file is provided
const certPath = process.env.PGSSLROOTCERT || process.env.NODE_EXTRA_CA_CERTS;
let sslConfig = false; // Default to no SSL for local connections

if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('aivencloud')) {
  console.log('Using cloud database, configuring SSL...');
  
  // For Aiven cloud database, properly configure SSL
  if (certPath && fs.existsSync(certPath)) {
    console.log(`Found certificate file at: ${certPath}`);
    try {
      // Use the certificate file and enable verification
      sslConfig = {
        rejectUnauthorized: true,
        ca: fs.readFileSync(certPath).toString(),
      };
      console.log('Successfully loaded SSL certificate');
    } catch (err) {
      console.error(`Error with certificate file: ${err.message}`);
      // Fallback to secure default - reject unauthorized connections
      sslConfig = { rejectUnauthorized: true };
    }
  } else {
    console.log('No certificate file found - using secure default SSL configuration');
    // Still enable SSL but don't provide a specific CA
    sslConfig = { rejectUnauthorized: true };
  }
}

// Create connection pool
console.log(`SSL config: ${JSON.stringify(sslConfig)}`);
console.log(`Database URL: ${process.env.DATABASE_URL}`);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Successfully connected to PostgreSQL database');
    release();
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err.message);
});

export default pool; 