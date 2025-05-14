import SecureVote from '../models/SecureVote.js';

const secureVoteController = {
  async getAllVotes(req, res) {
    try {
      const votes = await SecureVote.getAll();
      res.json(votes);
    } catch (err) {
      console.error('Error fetching votes:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getVoteCountsByPollId(req, res) {
    const { id } = req.params;
    try {
      const voteCounts = await SecureVote.getVoteCountsByPollId(id);
      res.json(voteCounts);
    } catch (err) {
      console.error('Error fetching vote counts:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async submitVote(req, res) {
    const { pollId, optionId } = req.body;
    // Get userId from the authenticated user
    const userId = req.user.id;
    
    if (!pollId || !optionId) {
      return res.status(400).json({ error: 'Poll ID and option ID are required' });
    }
    
    try {
      // Check if user has already voted
      const hasVoted = await SecureVote.hasUserVoted(userId, pollId);

      const result = await SecureVote.submitVote(pollId, optionId, userId);
      
      // Return the verification token to the user so they can verify their vote later
      res.json({
        message: hasVoted ? 'Your vote has been updated!' : 'Vote successfully cast',
        verificationToken: result.verificationToken,
        pollId: result.pollId
      });
    } catch (err) {
      console.error('Error submitting vote:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async verifyVote(req, res) {
    const { pollId, verificationToken } = req.body;
    const userId = req.user.id;
    
    if (!pollId || !verificationToken) {
      return res.status(400).json({ error: 'Poll ID and verification token are required' });
    }
    
    try {
      const verificationResult = await SecureVote.verifyVote(pollId, userId, verificationToken);
      res.json(verificationResult);
    } catch (err) {
      console.error('Error verifying vote:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  async createVote(req, res) {
    const { title, description, allow_multiple_choices, options } = req.body;
    const userId = req.user.id;
    
    if (!title || !options || !options.length) {
      return res.status(400).json({ 
        error: 'Title and at least one option are required' 
      });
    }
  
    try {
      const newPoll = await SecureVote.create(
        title, 
        description, 
        userId, 
        allow_multiple_choices, 
        options
      );
      
      res.status(201).json(newPoll);
    } catch (err) {
      console.error('Error creating poll:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  async checkVoterStatus(req, res) {
    const { pollId } = req.params;
    const userId = req.user.id;
    
    if (!pollId) {
      return res.status(400).json({ error: 'Poll ID is required' });
    }
    
    try {
      const hasVoted = await SecureVote.hasUserVoted(userId, pollId);
      res.json({ hasVoted });
    } catch (err) {
      console.error('Error checking voter status:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default secureVoteController; 