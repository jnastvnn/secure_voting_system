import pool from '../config/db.js';
import {
  encryptVote,
  generateVerificationHash,
  generateVerificationToken,
  generateVoteId,
  updateEncryptedTally,
  countVotesFromTally
} from '../utils/secureVoting.js';

class SecureVote {
  static async getAll() {
    const result = await pool.query(`
      SELECT 
        p.id AS poll_id,
        p.title AS poll_title,
        p.description AS poll_description,
        p.created_at,
        p.created_by,
        p.expires_at,
        p.is_active,
        p.allow_multiple_choices,
        o.id AS option_id,
        o.option_text
      FROM 
        polls p
      JOIN 
        poll_options po ON p.id = po.poll_id
      JOIN 
        options o ON po.option_id = o.id
      ORDER BY 
        p.id, o.id;
    `);
  
    // Transform rows into a structured JSON format
    const pollsMap = {};
    
    result.rows.forEach(row => {
      if (!pollsMap[row.poll_id]) {
        pollsMap[row.poll_id] = {
          id: row.poll_id,
          title: row.poll_title,
          description: row.poll_description,
          created_at: row.created_at,
          created_by: row.created_by,
          expires_at: row.expires_at,
          is_active: row.is_active || true,
          allow_multiple_choices: row.allow_multiple_choices,
          options: []
        };
      }
      
      pollsMap[row.poll_id].options.push({
        id: row.option_id,
        text: row.option_text
      });
    });
    
    // Convert to array
    return Object.values(pollsMap);
  }

  /**
   * Submit a vote securely, implementing ballot secrecy and individual verifiability
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
   * Get vote counts for a poll using the homomorphic-like tally
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
   */
  static async hasUserVoted(userId, pollId) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM voter_participation
       WHERE user_id = $1 AND poll_id = $2`,
      [userId, pollId]
    );
    
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Create a new poll (reusing existing functionality)
   */
  static async create(title, description, createdBy, allow_multiple_choices, options) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert poll into polls table
      const pollInsertQuery = `
        INSERT INTO polls (
          title,
          description,
          created_by,
          allow_multiple_choices
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const pollResult = await client.query(pollInsertQuery, [
        title,
        description || null,
        createdBy || null,
        allow_multiple_choices ?? false
      ]);
      const poll = pollResult.rows[0];
      
      for (const option_text of options) {
        // Insert the option with upsert logic
        const optionInsertQuery = `
          INSERT INTO options (option_text)
          VALUES ($1)
          ON CONFLICT (option_text)
            DO UPDATE SET option_text = EXCLUDED.option_text
          RETURNING id
        `;
        const optionResult = await client.query(optionInsertQuery, [option_text]);
        let optionId;
        
        if (optionResult.rows.length > 0) {
          optionId = optionResult.rows[0].id;
        } else {
          // Fetch the existing option id
          const fallbackResult = await client.query(
            `SELECT id FROM options WHERE option_text = $1`,
            [option_text]
          );
          if (fallbackResult.rows.length > 0) {
            optionId = fallbackResult.rows[0].id;
          } else {
            throw new Error('Failed to retrieve option id');
          }
        }
  
        // Link the poll with this option
        const pollOptionsInsertQuery = `
          INSERT INTO poll_options (poll_id, option_id)
          VALUES ($1, $2)
        `;
        await client.query(pollOptionsInsertQuery, [poll.id, optionId]);
      }
  
      // Initialize empty tally for the poll
      await client.query(
        `INSERT INTO encrypted_tallies (poll_id, tally_data)
         VALUES ($1, '{}'::jsonb)`,
        [poll.id]
      );
      
      await client.query('COMMIT');
      
      return {
        ...poll,
        options: options.map(text => ({ text }))
      };
  
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create poll: ${error.message}`);
    } finally {
      client.release();
    }
  }
}

export default SecureVote; 