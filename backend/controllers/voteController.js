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

  async getOptionById(req, res) {
    const { id } = req.params;
    try {
      const vote = await Vote.getOptionById(id);
      if (!vote) {
        return res.status(404).json({ error: 'Vote not found' });
      }
      res.json(vote);
    } catch (err) {
      console.error('Error fetching vote by ID:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getVoteCountsByPollId(req, res) {
    
    const { id } = req.params;
    try {
      const voteCounts = await Vote.getVoteCountsByPollId(id);
      if (!voteCounts) {
        return res.status(404).json({ error: 'Vote counts not found' });
      }
      console.log('Vote counts:', voteCounts); // Log the vote counts for debugging
      res.json(voteCounts);
    } catch (err) {
      console.error('Error fetching vote counts:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async submitVote(req, res) {
    const { pollId, optionId } = req.body;
    // Get userId from the authenticated user in the request
    const userId = req.user.id;
    
    console.log('Vote submission:', { pollId, optionId, userId }); // Log vote details
    
    if (!pollId || !optionId) {
      return res.status(400).json({ error: 'Poll ID and option ID are required' });
    }
    
    try {
      const updatedVote = await Vote.submitVote(pollId, optionId, userId);
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