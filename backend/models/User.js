import pool from '../config/db.js';

class User {
  static async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  static async create(username, password) {
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, password]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT id, username FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }
}

export default User; 