import pool from '../config/db.js';

class Vote {
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
  
    const rows = result.rows; // Correctly access the rows property
  
    // Transform rows into a more structured JSON format
    const pollsMap = {};
    
    rows.forEach(row => {
      if (!pollsMap[row.poll_id]) {
        pollsMap[row.poll_id] = {
          id: row.poll_id,
          title: row.poll_title,
          description: row.poll_description,
          created_at: row.created_at,
          created_by: row.created_by,
          expires_at: row.expires_at,
          is_active: row.is_active,
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
    const polls = Object.values(pollsMap);
  
    return polls; // Return the structured polls array
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM polls WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async getNumberOfVotesById(id) {
    const result = await pool.query('SELECT votes FROM votes WHERE id = $1', [id]);
    return result.rows[0];
  }

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

        // Insert the option with upsert logic.
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
          // In case nothing is returned (this branch is rarely reached with a proper upsert),
          // fetch the existing option id.
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
  
        // Link the poll with this option by inserting into poll_options table.
        const pollOptionsInsertQuery = `
          INSERT INTO poll_options (poll_id, option_id)
          VALUES ($1, $2)
        `;
        await client.query(pollOptionsInsertQuery, [poll.id, optionId]);
      }
  
      // Commit all the changes.
      await client.query('COMMIT');
  
      
      return {
        ...poll,
        options: options
      };
  
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create poll: ${error.message}`);
    } finally {
      client.release();
    }
  }
  
}

export default Vote; 