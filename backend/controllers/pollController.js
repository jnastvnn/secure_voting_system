import Vote from '../models/Vote.js';
import SecureVote from '../models/SecureVote.js';

/**
 * Unified controller for handling both standard and secure polls
 */
const pollController = {
  /**
   * Get all polls based on mode (secure or standard)
   */
  async getAllPolls(req, res) {
    try {
      const { secure } = req.query;
      const isSecure = secure === 'true';
      
      // Select the appropriate model based on the secure parameter
      const polls = isSecure ? 
        await SecureVote.getAll() : 
        await Vote.getAll();
      
      res.json(polls);
    } catch (err) {
      console.error('Error fetching polls:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Create a new poll based on mode (secure or standard)
   */
  async createPoll(req, res) {
    try {
      const { title, description, options, allow_multiple_choices } = req.body;
      const userId = req.user.id;
      const { secure } = req.query;
      const isSecure = secure === 'true';
      
      // Validate request
      if (!title || !options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ 
          error: 'Please provide a title and at least two options' 
        });
      }
      
      // Create poll using the appropriate model
      const poll = isSecure ? 
        await SecureVote.create(title, description, userId, allow_multiple_choices, options) : 
        await Vote.create(title, description, userId, allow_multiple_choices, options);
      
      res.status(201).json(poll);
    } catch (err) {
      console.error('Error creating poll:', err);
      res.status(500).json({ error: 'Failed to create poll' });
    }
  },

  /**
   * Submit a vote on a poll based on mode (secure or standard)
   */
  async submitVote(req, res) {
    try {
      const { pollId, optionId } = req.body;
      const userId = req.user.id;
      const { secure } = req.query;
      const isSecure = secure === 'true';
      
      // Validate request
      if (!pollId || !optionId) {
        return res.status(400).json({ 
          error: 'Please provide pollId and optionId' 
        });
      }
      
      // Submit vote using the appropriate model
      const result = isSecure ? 
        await SecureVote.submitVote(pollId, optionId, userId) : 
        await Vote.submitVote(pollId, optionId, userId);
      
      res.json(result);
    } catch (err) {
      console.error('Error submitting vote:', err);
      res.status(500).json({ error: 'Failed to submit vote' });
    }
  },

  /**
   * Get vote counts for a specific poll
   */
  async getVoteCounts(req, res) {
    try {
      const { pollId } = req.params;
      const { secure } = req.query;
      const isSecure = secure === 'true';
      
      // Get vote counts using the appropriate model
      const counts = isSecure ? 
        await SecureVote.getVoteCountsByPollId(pollId) : 
        await Vote.getVoteCountsByPollId(pollId);
      
      res.json(counts);
    } catch (err) {
      console.error('Error fetching vote counts:', err);
      res.status(500).json({ error: 'Failed to get vote counts' });
    }
  },

  /**
   * Verify a secure vote (only applies to secure polls)
   */
  async verifyVote(req, res) {
    try {
      const { pollId, verificationToken } = req.body;
      const userId = req.user.id;
      
      if (!pollId || !verificationToken) {
        return res.status(400).json({ 
          error: 'Please provide pollId and verificationToken' 
        });
      }
      
      const result = await SecureVote.verifyVote(pollId, userId, verificationToken);
      res.json(result);
    } catch (err) {
      console.error('Error verifying vote:', err);
      res.status(500).json({ error: 'Failed to verify vote' });
    }
  },

  /**
   * Check if a user has already voted on a secure poll
   */
  async hasUserVoted(req, res) {
    try {
      const { pollId } = req.params;
      const userId = req.user.id;
      
      const hasVoted = await SecureVote.hasUserVoted(userId, pollId);
      res.json({ hasVoted });
    } catch (err) {
      console.error('Error checking vote status:', err);
      res.status(500).json({ error: 'Failed to check vote status' });
    }
  }
};

export default pollController; 