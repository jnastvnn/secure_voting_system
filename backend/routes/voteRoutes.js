import express from 'express';
import voteController from '../controllers/voteController.js';

const router = express.Router();

router.get('/', voteController.getAllVotes);
router.post('/vote', voteController.submitVote);

export default router; 