import express from 'express';
import secureVoteController from '../controllers/secureVoteController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all available polls/votes
router.get('/', secureVoteController.getAllVotes);

// Create a new poll
router.post('/create', secureVoteController.createVote);

// Get vote counts for a specific poll
router.get('/poll/:id/votes', secureVoteController.getVoteCountsByPollId);

// Check if a user has voted in a specific poll
router.get('/poll/:pollId/status', secureVoteController.checkVoterStatus);

// Submit a vote
router.post('/vote', secureVoteController.submitVote);

// Verify a vote using a verification token
router.post('/verify', secureVoteController.verifyVote);

export default router; 