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
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create votes table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        options JSONB NOT NULL,
        votes JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if there are any votes, if not, add some initial votes
    const votesResult = await client.query('SELECT * FROM votes');
    if (votesResult.rows.length === 0) {
      await client.query(`
        INSERT INTO votes (title, options, votes) VALUES 
        ('Best Programming Language', '["JavaScript", "Python", "Java", "C++", "Go"]', '{}'),
        ('Favorite Frontend Framework', '["React", "Vue", "Angular", "Svelte"]', '{}'),
        ('Best Database', '["PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis"]', '{}')
      `);
    }
    
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
    
    const votesPath = path.join(dataDir, 'votes.json');
    if (!fs.existsSync(votesPath)) {
      fs.writeFileSync(votesPath, JSON.stringify([
        { 
          id: 1, 
          title: 'Best Programming Language', 
          options: ['JavaScript', 'Python', 'Java', 'C++', 'Go'], 
          votes: {}, 
          created_at: new Date().toISOString() 
        },
        { 
          id: 2, 
          title: 'Favorite Frontend Framework', 
          options: ['React', 'Vue', 'Angular', 'Svelte'], 
          votes: {}, 
          created_at: new Date().toISOString() 
        },
        { 
          id: 3, 
          title: 'Best Database', 
          options: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Redis'], 
          votes: {}, 
          created_at: new Date().toISOString() 
        }
      ]));
    }
    
    // We don't throw the error so the application can continue with local storage
    return 'local';
  }
  return 'database';
}

export default initializeDatabase; 