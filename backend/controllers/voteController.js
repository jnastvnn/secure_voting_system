import Vote from '../models/Vote.js';

const voteController = {
  async getAllVotes(req, res) {
    try {
      const votes = await Vote.getAll();
      res.json(votes);
    } catch (err) {
      console.error('Error fetching votes:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async submitVote(req, res) {
    const { voteId, option, userId } = req.body;
    
    if (!voteId || !option || !userId) {
      return res.status(400).json({ error: 'Vote ID, option, and user ID are required' });
    }
    
    try {
      const updatedVote = await Vote.submitVote(voteId, userId, option);
      if (!updatedVote) {
        return res.status(404).json({ error: 'Vote not found' });
      }
      res.json(updatedVote);
    } catch (err) {
      console.error('Error submitting vote:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default voteController; 