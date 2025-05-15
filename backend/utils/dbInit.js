import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, -- PostgreSQL auto-incrementing integer
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL, -- For storing bcrypt/Argon2 hashes
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp with time zone
        last_login TIMESTAMPTZ 
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS options (
      id SERIAL PRIMARY KEY,
      option_text TEXT NOT NULL UNIQUE -- Unique constraint good for reusable options like 'Yes'/'No'
    )`);  

    // Create polls table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS polls (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        created_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL, -- ON DELETE SET NULL: If user deleted, poll creator becomes NULL
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        allow_multiple_choices BOOLEAN DEFAULT FALSE,
        is_secure BOOLEAN DEFAULT FALSE
      )`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS poll_options (
        poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE, -- If poll deleted, these links are removed
        option_id INTEGER NOT NULL REFERENCES options(id) ON DELETE CASCADE, -- If option deleted, remove links
        PRIMARY KEY (poll_id, option_id) -- Composite primary key to ensure unique poll-option pairs
)
    `);

    await client.query(`  
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY, -- Optional, but useful for referencing individual vote records
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- If user deleted, their votes are removed
        poll_id INTEGER NOT NULL,
        option_id INTEGER NOT NULL,
        voted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, poll_id, option_id), -- User can vote for a specific option in a poll only once
        FOREIGN KEY (poll_id, option_id) REFERENCES poll_options (poll_id, option_id) ON DELETE CASCADE -- Ensures vote is for a valid poll-option pair
)
    `);

    // Tables for secure voting
    await client.query(`
      CREATE TABLE IF NOT EXISTS anonymous_votes (
        vote_id UUID PRIMARY KEY,
        poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        option_id INTEGER NOT NULL,
        encrypted_choice TEXT NOT NULL,
        vote_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS voter_participation (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        verification_token TEXT NOT NULL,
        voted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, poll_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS encrypted_tallies (
        poll_id INTEGER PRIMARY KEY REFERENCES polls(id) ON DELETE CASCADE,
        tally_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    client.release();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    console.log('Falling back to local storage mode');
    
    // Create a fallback file to indicate we're using local storage
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Create initial data files if they don't exist
    const usersPath = path.join(dataDir, 'users.json');
    if (!fs.existsSync(usersPath)) {
      fs.writeFileSync(usersPath, JSON.stringify([
        { id: 1, username: 'admin', password: 'password', created_at: new Date().toISOString() }
      ]));
    }
  }
  return 'database';
}

export default initializeDatabase; 