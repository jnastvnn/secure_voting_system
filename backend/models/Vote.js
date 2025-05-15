import pool from '../config/db.js';
import BasePoll from './BasePoll.js';

/**
 * Vote model - Handles standard (non-secure) voting polls
 * Extends BasePoll for common functionality
 */
class Vote extends BasePoll {
  /**
   * Get all standard (non-secure) polls
   * @returns {Array} - Array of standard poll objects
   */
  static async getAll() {
    return super.getAll(false);
  }

  /**
   * Create a new standard poll
   * @param {string} title - Poll title
   * @param {string} description - Poll description
   * @param {number} createdBy - User ID who created the poll
   * @param {boolean} allow_multiple_choices - Whether multiple choices are allowed
   * @param {Array<string>} options - Array of option texts
   * @returns {Object} - The created standard poll with options
   */
  static async create(title, description, createdBy, allow_multiple_choices, options) {
    return super.create(title, description, createdBy, allow_multiple_choices, options, false);
  }

  /**
   * Get vote counts for a standard poll
   * @param {number} pollId - Poll ID
   * @returns {Object} - Object mapping option IDs to vote counts
   */
  static async getVoteCountsByPollId(pollId) {
    const result = await pool.query(
      `SELECT o.id AS option_id, o.option_text, COUNT(v.id) AS vote_count
       FROM options o
       LEFT JOIN votes v ON o.id = v.option_id
       WHERE o.id IN (SELECT option_id FROM poll_options WHERE poll_id = $1)
       GROUP BY o.id, o.option_text`,
      [pollId]
    );
    
    const voteCounts = {};
    result.rows.forEach(row => {
      voteCounts[row.option_id] = row.vote_count;
    });
    
    return voteCounts;
  }

  /**
   * Submit a vote for a standard poll
   * @param {number} pollId - Poll ID
   * @param {number} optionId - Option ID
   * @param {number} userId - User ID
   * @returns {Object} - The submitted vote
   */
  static async submitVote(pollId, optionId, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Try to update existing vote first
      const updateResult = await client.query(
        `UPDATE votes 
         SET option_id = $2, voted_at = NOW() 
         WHERE poll_id = $1 AND user_id = $3 
         RETURNING *`,
        [pollId, optionId, userId]
      );

      // If no existing vote was found, insert new one
      if (updateResult.rows.length === 0) {
        const insertResult = await client.query(
          `INSERT INTO votes (poll_id, option_id, user_id, voted_at) 
           VALUES ($1, $2, $3, NOW()) 
           RETURNING *`,
          [pollId, optionId, userId]
        );
        await client.query('COMMIT');
        
        return insertResult.rows[0];
      }
  
      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to submit vote: ${error.message}`);
    } finally {
      client.release();
    }
  }
}

export default Vote; 