import express from 'express';
import voteController from '../controllers/voteController.js';
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

router.get('/', authMiddleware, voteController.getAllVotes);
router.get('/poll/:id/votes', authMiddleware, voteController.getVoteCountsByPollId);
router.post('/vote', authMiddleware, voteController.submitVote);
router.post('/create', authMiddleware, voteController.createVote);

export default router; 