import pool from '../config/db.js';

/**
 * BasePoll - Abstract base class for poll operations
 * Contains shared functionality between standard and secure polls
 */
class BasePoll {
  /**
   * Retrieves all polls from the database based on security type
   * @param {boolean} isSecure - Whether to fetch secure or standard polls
   * @returns {Array} - Array of poll objects with nested options
   */
  static async getAll(isSecure = false) {
    try {
      const result = await pool.query(`
        SELECT 
          p.id AS poll_id,
          p.title AS poll_title,
          p.description AS poll_description,
          p.created_at,
          p.created_by,
          p.allow_multiple_choices,
          u.username AS creator_username,
          o.id AS option_id,
          o.option_text
        FROM 
          polls p
        LEFT JOIN 
          users u ON p.created_by = u.id
        LEFT JOIN 
          poll_options po ON p.id = po.poll_id
        LEFT JOIN 
          options o ON po.option_id = o.id
        WHERE
          p.is_secure = $1
        ORDER BY 
          p.id, o.id;
      `, [isSecure]);
    
      const rows = result.rows;
      
      // If no polls exist, return an empty array
      if (rows.length === 0) {
        return [];
      }
    
      // Transform rows into a more structured JSON format
      const pollsMap = {};
      
      rows.forEach(row => {
        // Skip rows without valid poll_id or null results from LEFT JOIN
        if (!row.poll_id) return;
        
        if (!pollsMap[row.poll_id]) {
          pollsMap[row.poll_id] = {
            id: row.poll_id,
            title: row.poll_title,
            description: row.poll_description,
            created_at: row.created_at,
            created_by: row.created_by,
            creator_username: row.creator_username || 'Anonymous',
            allow_multiple_choices: row.allow_multiple_choices,
            options: []
          };
        }
        
        // Only add options if they exist
        if (row.option_id) {
          pollsMap[row.poll_id].options.push({
            id: row.option_id,
            text: row.option_text
          });
        }
      });
      
      // Convert to array
      return Object.values(pollsMap);
    } catch (error) {
      console.error('Error in BasePoll.getAll():', error);
      throw error;
    }
  }

  /**
   * Creates a new poll with associated options
   * @param {string} title - Poll title
   * @param {string} description - Poll description
   * @param {number} createdBy - User ID who created the poll
   * @param {boolean} allow_multiple_choices - Whether multiple choices are allowed
   * @param {Array<string>} options - Array of option texts
   * @param {boolean} isSecure - Whether this is a secure poll
   * @returns {Object} - The created poll with options
   */
  static async create(title, description, createdBy, allow_multiple_choices, options, isSecure = false) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert poll into polls table
      const pollInsertQuery = `
        INSERT INTO polls (
          title,
          description,
          created_by,
          allow_multiple_choices,
          is_secure
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const pollResult = await client.query(pollInsertQuery, [
        title,
        description || null,
        createdBy || null,
        allow_multiple_choices ?? false,
        isSecure
      ]);
      const poll = pollResult.rows[0];
  
      // Add options to the poll
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
          // In case nothing is returned, fetch the existing option id
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
  
      // Commit all the changes
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
  
  /**
   * Get a poll by its ID
   * @param {number} id - Poll ID
   * @returns {Object} - Poll data
   */
  static async getById(id) {
    const result = await pool.query('SELECT * FROM polls WHERE id = $1', [id]);
    return result.rows[0];
  }
}

export default BasePoll; 