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
  },
  
  async createVote(req, res) {
    const { title, description, allow_multiple_choices, options } = req.body;
    console.log('Request body:', req.body); 
    console.log('User from JWT:', req.user.id);
    // Validate required fields (options removed)
    if (!title || !description) {
      console.log('Creating vote with data:', req.body);
      return res.status(400).json({ error: 'Title, description, and creator ID are required' });
    }
  
    try {
      // Create the poll in the database using the updated Vote.create method
      const newVote = await Vote.create(title, description, req.user.id, allow_multiple_choices, options);
  
      // Respond with the created poll
      res.status(201).json(newVote);
    } catch (err) {
      console.error('Error creating vote:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  

};

export default voteController; 