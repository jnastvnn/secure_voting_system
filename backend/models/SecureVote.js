import pool from '../config/db.js';
import BasePoll from './BasePoll.js';
import {
  encryptVote,
  generateVerificationHash,
  generateVerificationToken,
  generateVoteId,
  updateEncryptedTally,
  countVotesFromTally
} from '../utils/secureVoting.js';

/**
 * SecureVote model - Handles secure voting polls with enhanced privacy
 * Extends BasePoll for common functionality
 */
class SecureVote extends BasePoll {
  /**
   * Get all secure polls
   * @returns {Array} - Array of secure poll objects
   */
  static async getAll() {
    return super.getAll(true);
  }

  /**
   * Create a new secure poll
   * @param {string} title - Poll title
   * @param {string} description - Poll description
   * @param {number} createdBy - User ID who created the poll
   * @param {boolean} allow_multiple_choices - Whether multiple choices are allowed
   * @param {Array<string>} options - Array of option texts
   * @returns {Object} - The created secure poll with options
   */
  static async create(title, description, createdBy, allow_multiple_choices, options) {
    const client = await pool.connect();
    try {
      // Create the poll using the parent class method
      const poll = await super.create(title, description, createdBy, allow_multiple_choices, options, true);
      
      // Initialize empty tally for the poll
      await client.query(
        `INSERT INTO encrypted_tallies (poll_id, tally_data)
         VALUES ($1, '{}'::jsonb)
         ON CONFLICT (poll_id) DO NOTHING`,
        [poll.id]
      );
      
      return poll;
    } finally {
      client.release();
    }
  }

  /**
   * Submit a vote securely, implementing ballot secrecy and individual verifiability
   * @param {number} pollId - Poll ID
   * @param {number} optionId - Option ID
   * @param {number} userId - User ID
   * @returns {Object} - Verification info for the voter
   */
  static async submitVote(pollId, optionId, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generate a unique vote ID
      const voteId = generateVoteId();
      
      // Create vote data object
      const voteData = {
        pollId,
        optionId,
        timestamp: new Date().toISOString()
      };
      
      // Encrypt the vote
      const { encrypted, salt } = encryptVote(voteData);
      
      // Generate a verification hash for this vote
      const voteHash = generateVerificationHash(voteData, salt);
      
      // Insert the anonymous vote record
      await client.query(
        `INSERT INTO anonymous_votes
          (vote_id, poll_id, option_id, encrypted_choice, vote_hash)
         VALUES ($1, $2, $3, $4, $5)`,
        [voteId, pollId, optionId, encrypted, voteHash]
      );
      
      // Generate a verification token for the voter
      const verificationToken = generateVerificationToken(voteId, voteHash);
      
      // Mark that this user has participated in this poll
      // This is stored separately from the actual vote to maintain ballot secrecy
      await client.query(
        `INSERT INTO voter_participation (user_id, poll_id, verification_token)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, poll_id) 
         DO UPDATE SET verification_token = $3, voted_at = NOW()`,
        [userId, pollId, verificationToken]
      );
      
      // Update the homomorphic-like tally
      let tallyData = {};
      const tallyResult = await client.query(
        'SELECT tally_data FROM encrypted_tallies WHERE poll_id = $1',
        [pollId]
      );
      
      if (tallyResult.rows.length > 0) {
        tallyData = tallyResult.rows[0].tally_data;
      }
      
      // Update the tally with the new vote
      const updatedTally = updateEncryptedTally(tallyData, optionId);
      
      // Save the updated tally
      await client.query(
        `INSERT INTO encrypted_tallies (poll_id, tally_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (poll_id)
         DO UPDATE SET tally_data = $2, updated_at = NOW()`,
        [pollId, JSON.stringify(updatedTally)]
      );
      
      await client.query('COMMIT');
      
      // Return verification info to the user
      return {
        pollId,
        verificationToken,
        message: "Vote successfully cast"
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to submit vote: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get vote counts for a secure poll using the homomorphic-like tally
   * @param {number} pollId - Poll ID
   * @returns {Object} - Object mapping option IDs to vote counts
   */
  static async getVoteCountsByPollId(pollId) {
    const result = await pool.query(
      'SELECT tally_data FROM encrypted_tallies WHERE poll_id = $1',
      [pollId]
    );
    
    if (result.rows.length === 0) {
      return {}; // No votes yet
    }
    
    const tallyData = result.rows[0].tally_data;
    return countVotesFromTally(tallyData);
  }

  /**
   * Allow a voter to verify their vote was counted correctly
   * @param {number} pollId - Poll ID
   * @param {number} userId - User ID
   * @param {string} verificationToken - Token provided to the user when voting
   * @returns {Object} - Verification status
   */
  static async verifyVote(pollId, userId, verificationToken) {
    try {
      // Get the verification token for this user and poll
      const result = await pool.query(
        `SELECT verification_token FROM voter_participation
         WHERE user_id = $1 AND poll_id = $2`,
        [userId, pollId]
      );
      
      if (result.rows.length === 0) {
        return { verified: false, error: "No vote found for this poll" };
      }
      
      const storedToken = result.rows[0].verification_token;
      
      // Compare the tokens
      if (storedToken === verificationToken) {
        return { verified: true, message: "Your vote has been verified!" };
      } else {
        return { verified: false, error: "Verification failed" };
      }
    } catch (error) {
      console.error('Vote verification error:', error);
      throw new Error(`Failed to verify vote: ${error.message}`);
    }
  }

  /**
   * Check if a user has already voted in a specific poll
   * @param {number} pollId - Poll ID
   * @param {number} userId - User ID
   * @returns {boolean} - Whether the user has voted
   */
  static async hasUserVoted(userId, pollId) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM voter_participation
       WHERE user_id = $1 AND poll_id = $2`,
      [userId, pollId]
    );
    
    return parseInt(result.rows[0].count) > 0;
  }
}

export default SecureVote; 