import pool from '../config/db.js';

class Vote {
  static async getAll() {
    const result = await pool.query('SELECT * FROM votes ORDER BY created_at DESC');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM votes WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async submitVote(voteId, userId, option) {
    const vote = await this.getById(voteId);
    if (!vote) return null;

    const votes = vote.votes || {};
    votes[userId] = option;

    const result = await pool.query(
      'UPDATE votes SET votes = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(votes), voteId]
    );
    return result.rows[0];
  }

  static async create(title, options) {
    const result = await pool.query(
      'INSERT INTO votes (title, options, votes) VALUES ($1, $2, $3) RETURNING *',
      [title, JSON.stringify(options), JSON.stringify({})]
    );
    return result.rows[0];
  }
}

export default Vote; 